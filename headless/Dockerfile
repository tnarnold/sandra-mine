# SandraMine sem interface num container mínimo (só CPU).
#
# Use o binário estático (musl) da arquitetura da máquina, ao lado deste arquivo:
#   docker build -t sandra-mine-headless headless/
#   docker run -d --name sandra-mine --restart unless-stopped \
#     -e SANDRA_ADDRESS=bc1... -e SANDRA_WORKER=sm-nas \
#     -v /sys/class/thermal:/sys/class/thermal:ro sandra-mine-headless
#
# Defina SANDRA_WORKER: dentro do container o nome do computador é o id aleatório do container.
# SANDRA_THREADS, SANDRA_CPU, SANDRA_POOL e SANDRA_MAX_TEMP também valem (veja --help).
# O SCHED_IDLE não precisa de privilégio: os mineradores só usam CPU que sobra no host.
FROM scratch
COPY sandra-mine-headless /sandra-mine-headless
# Certificados não são necessários: o stratum é TCP puro e as APIs usam o rustls com webpki-roots.
ENTRYPOINT ["/sandra-mine-headless", "--config", "/data/headless.json"]
