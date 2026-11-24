// SHA-256d of a Bitcoin header in OpenCL: the same search as sha256d.wgsl.
// Each work item hashes ITER consecutive nonces starting at base + gid * ITER.
// params: midstate[8], header words 16..18 (big endian), base, threshold.

#define ROR(x, n) rotate((uint)(x), (uint)(32 - (n)))
#define S0(a) (ROR(a, 2) ^ ROR(a, 13) ^ ROR(a, 22))
#define S1(e) (ROR(e, 6) ^ ROR(e, 11) ^ ROR(e, 25))
#define s0(x) (ROR(x, 7) ^ ROR(x, 18) ^ ((x) >> 3))
#define s1(x) (ROR(x, 17) ^ ROR(x, 19) ^ ((x) >> 10))
#define CH(e, f, g) bitselect(g, f, e)
#define MAJ(a, b, c) bitselect(a, b, (a) ^ (c))
#define BSWAP(x) as_uint(as_uchar4(x).wzyx)

__constant uint K[64] = {
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2};

#define RND(a, b, c, d, e, f, g, h, k, w)          \
    {                                              \
        uint t1 = h + S1(e) + CH(e, f, g) + k + w; \
        d += t1;                                   \
        h = t1 + S0(a) + MAJ(a, b, c);             \
    }

inline void compress(uint *s, uint *w) {
    uint a = s[0], b = s[1], c = s[2], d = s[3], e = s[4], f = s[5], g = s[6], h = s[7];
#pragma unroll
    for (int i = 0; i < 64; i += 8) {
        if (i >= 16) {
#pragma unroll
            for (int j = 0; j < 8; j++) {
                int q = (i + j) & 15;
                w[q] += s0(w[(q + 1) & 15]) + w[(q + 9) & 15] + s1(w[(q + 14) & 15]);
            }
        }
        RND(a, b, c, d, e, f, g, h, K[i + 0], w[(i + 0) & 15]);
        RND(h, a, b, c, d, e, f, g, K[i + 1], w[(i + 1) & 15]);
        RND(g, h, a, b, c, d, e, f, K[i + 2], w[(i + 2) & 15]);
        RND(f, g, h, a, b, c, d, e, K[i + 3], w[(i + 3) & 15]);
        RND(e, f, g, h, a, b, c, d, K[i + 4], w[(i + 4) & 15]);
        RND(d, e, f, g, h, a, b, c, K[i + 5], w[(i + 5) & 15]);
        RND(c, d, e, f, g, h, a, b, K[i + 6], w[(i + 6) & 15]);
        RND(b, c, d, e, f, g, h, a, K[i + 7], w[(i + 7) & 15]);
    }
    s[0] += a; s[1] += b; s[2] += c; s[3] += d; s[4] += e; s[5] += f; s[6] += g; s[7] += h;
}

// out[0] = count, out[1..65] = candidate nonces
__kernel void mine(__constant uint *p, __global uint *out) {
    uint first = p[11] + (uint)get_global_id(0) * ITER;
    uint threshold = p[12];
    for (uint k = 0; k < ITER; k++) {
        uint nonce = first + k;
        uint s[8], w[16];
        for (int i = 0; i < 8; i++) s[i] = p[i];
        w[0] = p[8]; w[1] = p[9]; w[2] = p[10]; w[3] = BSWAP(nonce);
        w[4] = 0x80000000; for (int i = 5; i < 15; i++) w[i] = 0; w[15] = 640;
        compress(s, w);

        uint t[8] = {0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
                     0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19};
        for (int i = 0; i < 8; i++) w[i] = s[i];
        w[8] = 0x80000000; for (int i = 9; i < 15; i++) w[i] = 0; w[15] = 256;
        compress(t, w);

        if (t[7] == 0 || (threshold != 0 && BSWAP(t[7]) <= threshold)) {
            uint slot = atomic_inc(&out[0]);
            if (slot < 64) out[1 + slot] = nonce;
        }
    }
}
