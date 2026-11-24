//! GPU miner through OpenCL, for GPUs wgpu can't use: ARM's Mali driver ships Vulkan 1.0,
//! too old for wgpu, but its OpenCL 3.0 works. libOpenCL is loaded at run time, so the
//! binary starts (and mines on the CPU) on machines without it.

use crate::gpu::Backend;
use crate::work::{WorkUnit, top32_threshold};
use libloading::Library;
use std::ffi::{CString, c_char, c_void};
use std::ptr::{null, null_mut};

type Id = *mut c_void;
type Int = i32;

const CL_DEVICE_TYPE_GPU: u64 = 1 << 2;
const CL_DEVICE_NAME: u32 = 0x102B;
const CL_PROGRAM_BUILD_LOG: u32 = 0x1183;
const CL_MEM_READ_WRITE: u64 = 1 << 0;
const CL_MEM_READ_ONLY: u64 = 1 << 2;
const CL_TRUE: u32 = 1;

/// Nonces per work item; the batch (a multiple of 256) is always divisible by it.
const ITER: u32 = 16;
const OUT_WORDS: usize = 65;

#[cfg(target_os = "windows")]
const LIBS: &[&str] = &["OpenCL.dll"];
#[cfg(target_os = "macos")]
const LIBS: &[&str] = &["/System/Library/Frameworks/OpenCL.framework/OpenCL"];
#[cfg(not(any(target_os = "windows", target_os = "macos")))]
const LIBS: &[&str] = &["libOpenCL.so.1", "libOpenCL.so"];

#[allow(non_snake_case)]
struct Api {
    clGetPlatformIDs: unsafe extern "C" fn(u32, *mut Id, *mut u32) -> Int,
    clGetDeviceIDs: unsafe extern "C" fn(Id, u64, u32, *mut Id, *mut u32) -> Int,
    clGetDeviceInfo: unsafe extern "C" fn(Id, u32, usize, *mut c_void, *mut usize) -> Int,
    clCreateContext: unsafe extern "C" fn(*const isize, u32, *const Id, *const c_void, *mut c_void, *mut Int) -> Id,
    clCreateCommandQueue: unsafe extern "C" fn(Id, Id, u64, *mut Int) -> Id,
    clCreateProgramWithSource: unsafe extern "C" fn(Id, u32, *const *const c_char, *const usize, *mut Int) -> Id,
    clBuildProgram: unsafe extern "C" fn(Id, u32, *const Id, *const c_char, *const c_void, *mut c_void) -> Int,
    clGetProgramBuildInfo: unsafe extern "C" fn(Id, Id, u32, usize, *mut c_void, *mut usize) -> Int,
    clCreateKernel: unsafe extern "C" fn(Id, *const c_char, *mut Int) -> Id,
    clCreateBuffer: unsafe extern "C" fn(Id, u64, usize, *mut c_void, *mut Int) -> Id,
    clSetKernelArg: unsafe extern "C" fn(Id, u32, usize, *const c_void) -> Int,
    clEnqueueWriteBuffer: unsafe extern "C" fn(Id, Id, u32, usize, usize, *const c_void, u32, *const Id, *mut Id) -> Int,
    clEnqueueReadBuffer: unsafe extern "C" fn(Id, Id, u32, usize, usize, *mut c_void, u32, *const Id, *mut Id) -> Int,
    clEnqueueNDRangeKernel:
        unsafe extern "C" fn(Id, Id, u32, *const usize, *const usize, *const usize, u32, *const Id, *mut Id) -> Int,
    clReleaseMemObject: unsafe extern "C" fn(Id) -> Int,
    clReleaseKernel: unsafe extern "C" fn(Id) -> Int,
    clReleaseProgram: unsafe extern "C" fn(Id) -> Int,
    clReleaseCommandQueue: unsafe extern "C" fn(Id) -> Int,
    clReleaseContext: unsafe extern "C" fn(Id) -> Int,
    _lib: Library,
}

impl Api {
    fn load() -> Result<Api, String> {
        let mut last = String::new();
        for name in LIBS {
            // SAFETY: loading the system's OpenCL ICD loader, which has no init side effects.
            match unsafe { Library::new(*name) } {
                Ok(lib) => return Self::resolve(lib).map_err(|e| format!("{name}: {e}")),
                Err(e) => last = e.to_string(),
            }
        }
        Err(format!("OpenCL: {last}"))
    }

    fn resolve(lib: Library) -> Result<Api, libloading::Error> {
        macro_rules! sym {
            ($name:ident) => {
                // SAFETY: the type matches the OpenCL 1.2 prototype of the symbol.
                *unsafe { lib.get(concat!(stringify!($name), "\0").as_bytes())? }
            };
        }
        Ok(Api {
            clGetPlatformIDs: sym!(clGetPlatformIDs),
            clGetDeviceIDs: sym!(clGetDeviceIDs),
            clGetDeviceInfo: sym!(clGetDeviceInfo),
            clCreateContext: sym!(clCreateContext),
            clCreateCommandQueue: sym!(clCreateCommandQueue),
            clCreateProgramWithSource: sym!(clCreateProgramWithSource),
            clBuildProgram: sym!(clBuildProgram),
            clGetProgramBuildInfo: sym!(clGetProgramBuildInfo),
            clCreateKernel: sym!(clCreateKernel),
            clCreateBuffer: sym!(clCreateBuffer),
            clSetKernelArg: sym!(clSetKernelArg),
            clEnqueueWriteBuffer: sym!(clEnqueueWriteBuffer),
            clEnqueueReadBuffer: sym!(clEnqueueReadBuffer),
            clEnqueueNDRangeKernel: sym!(clEnqueueNDRangeKernel),
            clReleaseMemObject: sym!(clReleaseMemObject),
            clReleaseKernel: sym!(clReleaseKernel),
            clReleaseProgram: sym!(clReleaseProgram),
            clReleaseCommandQueue: sym!(clReleaseCommandQueue),
            clReleaseContext: sym!(clReleaseContext),
            _lib: lib,
        })
    }
}

fn check(what: &str, code: Int) -> Result<(), String> {
    if code == 0 { Ok(()) } else { Err(format!("{what}: OpenCL error {code}")) }
}

/// One GPU, its compiled kernel and buffers. Lives on the GPU thread only.
pub struct ClMiner {
    api: Api,
    ctx: Id,
    queue: Id,
    program: Id,
    kernel: Id,
    params: Id,
    out: Id,
    name: String,
}

impl ClMiner {
    pub fn new() -> Result<Self, String> {
        let api = Api::load()?;
        // SAFETY: plain OpenCL calls; every handle is checked before use and released in Drop.
        unsafe {
            let mut n = 0u32;
            check("clGetPlatformIDs", (api.clGetPlatformIDs)(0, null_mut(), &mut n))?;
            let mut platforms = vec![null_mut(); n as usize];
            check("clGetPlatformIDs", (api.clGetPlatformIDs)(n, platforms.as_mut_ptr(), null_mut()))?;
            let device = platforms
                .iter()
                .find_map(|&p| {
                    let mut d = null_mut();
                    ((api.clGetDeviceIDs)(p, CL_DEVICE_TYPE_GPU, 1, &mut d, null_mut()) == 0).then_some(d)
                })
                .ok_or("OpenCL: no GPU device")?;
            let mut buf = [0u8; 256];
            let mut len = 0usize;
            (api.clGetDeviceInfo)(device, CL_DEVICE_NAME, buf.len(), buf.as_mut_ptr().cast(), &mut len);
            let name = String::from_utf8_lossy(&buf[..len.min(buf.len())]).trim_end_matches('\0').trim().to_string();

            let mut err = 0;
            let ctx = (api.clCreateContext)(null(), 1, &device, null(), null_mut(), &mut err);
            check("clCreateContext", err)?;
            let mut m = ClMiner {
                api,
                ctx,
                queue: null_mut(),
                program: null_mut(),
                kernel: null_mut(),
                params: null_mut(),
                out: null_mut(),
                name: format!("{name} (OpenCL)"),
            };
            let a = &m.api;
            m.queue = (a.clCreateCommandQueue)(ctx, device, 0, &mut err);
            check("clCreateCommandQueue", err)?;
            let src = CString::new(include_str!("sha256d.cl")).unwrap();
            let src_ptr = src.as_ptr();
            m.program = (a.clCreateProgramWithSource)(ctx, 1, &src_ptr, null(), &mut err);
            check("clCreateProgramWithSource", err)?;
            let opts = CString::new(format!("-DITER={ITER}u")).unwrap();
            if (a.clBuildProgram)(m.program, 1, &device, opts.as_ptr(), null(), null_mut()) != 0 {
                let mut log = vec![0u8; 16384];
                let mut len = 0usize;
                (a.clGetProgramBuildInfo)(m.program, device, CL_PROGRAM_BUILD_LOG, log.len(), log.as_mut_ptr().cast(), &mut len);
                return Err(format!("OpenCL build: {}", String::from_utf8_lossy(&log[..len.min(log.len())])));
            }
            m.kernel = (a.clCreateKernel)(m.program, c"mine".as_ptr(), &mut err);
            check("clCreateKernel", err)?;
            m.params = (a.clCreateBuffer)(ctx, CL_MEM_READ_ONLY, 13 * 4, null_mut(), &mut err);
            check("clCreateBuffer", err)?;
            m.out = (a.clCreateBuffer)(ctx, CL_MEM_READ_WRITE, OUT_WORDS * 4, null_mut(), &mut err);
            check("clCreateBuffer", err)?;
            let id = std::mem::size_of::<Id>();
            check("clSetKernelArg", (a.clSetKernelArg)(m.kernel, 0, id, (&m.params as *const Id).cast()))?;
            check("clSetKernelArg", (a.clSetKernelArg)(m.kernel, 1, id, (&m.out as *const Id).cast()))?;
            Ok(m)
        }
    }

    fn try_run(&self, w: &WorkUnit, base: u32, count: u32) -> Result<Vec<u32>, String> {
        let be = |i: usize| u32::from_be_bytes(w.header[i..i + 4].try_into().unwrap());
        let mut p = [0u32; 13];
        p[..8].copy_from_slice(&w.midstate);
        p[8] = be(64);
        p[9] = be(68);
        p[10] = be(72);
        p[11] = base;
        p[12] = top32_threshold(w.pool_diff);
        let global = (count / ITER).max(1) as usize;
        let mut out = [0u32; OUT_WORDS];
        let a = &self.api;
        // SAFETY: the buffers are as big as the host arrays; all calls are blocking.
        unsafe {
            check("write params", (a.clEnqueueWriteBuffer)(self.queue, self.params, CL_TRUE, 0, 13 * 4, p.as_ptr().cast(), 0, null(), null_mut()))?;
            check("write out", (a.clEnqueueWriteBuffer)(self.queue, self.out, CL_TRUE, 0, 4, out.as_ptr().cast(), 0, null(), null_mut()))?;
            check("run", (a.clEnqueueNDRangeKernel)(self.queue, self.kernel, 1, null(), &global, null(), 0, null(), null_mut()))?;
            check("read out", (a.clEnqueueReadBuffer)(self.queue, self.out, CL_TRUE, 0, OUT_WORDS * 4, out.as_mut_ptr().cast(), 0, null(), null_mut()))?;
        }
        let n = (out[0] as usize).min(OUT_WORDS - 1);
        Ok(out[1..1 + n].to_vec())
    }
}

impl Backend for ClMiner {
    fn name(&self) -> &str {
        &self.name
    }

    fn run(&self, w: &WorkUnit, base: u32, count: u32) -> Result<Vec<u32>, String> {
        self.try_run(w, base, count)
    }
}

impl Drop for ClMiner {
    fn drop(&mut self) {
        let a = &self.api;
        // SAFETY: each handle was created by this struct and is released once.
        unsafe {
            for m in [self.params, self.out] {
                if !m.is_null() { (a.clReleaseMemObject)(m); }
            }
            if !self.kernel.is_null() { (a.clReleaseKernel)(self.kernel); }
            if !self.program.is_null() { (a.clReleaseProgram)(self.program); }
            if !self.queue.is_null() { (a.clReleaseCommandQueue)(self.queue); }
            if !self.ctx.is_null() { (a.clReleaseContext)(self.ctx); }
        }
    }
}
