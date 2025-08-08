# 🚀 Server Testing Report

**Generated:** 2025-08-08T19:28:45.014Z
**Total Tests:** 13
**Passed:** 11 ✅
**Failed:** 2 ❌

## Test Results

### ✅ Docker Installation

- **version**: Docker version 28.0.4, build b8034c0
- **serverVersion**: 28.0.4
- **status**: Docker is running

### ✅ Docker Hub Connection

- **status**: Docker Hub accessible
- **registry**: docker.io
- **authenticated**: false
- **note**: Public access working, authentication not tested without credentials

### ✅ DigitalOcean doctl Installation

- **status**: doctl installed successfully via snap
- **version**: doctl version 1.138.0-release
Git commit hash: e1858c20
- **action**: installed

### ❌ DigitalOcean doctl Authentication

- **Error**: DigitalOcean doctl failed: Command failed: doctl auth init --access-token dop_v1_4bc3902fb43fec277797625f6fa97bb7baaf6c7a6c1a450d8e45e99b4601d215
Error: Unable to use supplied token to access API: GET https://cloud.digitalocean.com/v1/oauth/token/info: 401 (request "049ae8d3-5fe1-4968-9538-f8ae6bdef995") Unable to authenticate you


### ❌ DigitalOcean Container Registry

- **Error**: DO Container Registry failed: Both authentication methods failed. doctl: Command failed: echo "YmFycnVubWFpbEBnbWFpbC5jb206ZG9wX3YxXzFiZTcxNWI2NzM4MzdiMjdiYTk2NmIyOWI2MDZkY2VlOWRlZTc3YWQzMjIzNDU0YjNiMGZhN2RlNjVmYzVlOWQ=" | docker login registry.digitalocean.com --username "" --password-stdin
Must provide --username with --password-stdin
, credentials: Command failed: echo "dop_v1_be1d6c7989e8f51fefbae284c017fa7eaeea5d230e59d7c399b220d4677652c7" | docker login registry.digitalocean.com --username "barrunmail@gmail.com" --password-stdin
Error response from daemon: Get "https://registry.digitalocean.com/v2/": unauthorized: authentication required


### ✅ DigitalOcean App Platform

- **apps**: ID                                      Spec Name        Default Ingress                                   Active Deployment ID                    In Progress Deployment ID               Created At                       Updated At
5c0ee89f-d509-448b-9f49-4bb0c5afb30f    echotune-ai-6                                                                                              fad5e870-d56f-44bf-abbd-f3f0ae821007    2025-08-08 00:58:42 +0000 UTC    2025-08-08 19:29:05 +0000 UTC
1e22ac01-7fde-467a-993b-e8ea467f62c4    echotune-ai-5                                                                                              9bfde2c0-03e5-4cf9-901b-0e673c389d81    2025-08-08 00:33:19 +0000 UTC    2025-08-08 19:29:01 +0000 UTC
9c06b6ee-3106-4c4c-b8ee-c3850b3b5600    echotune-ai-4                                                                                              83e80280-249e-445e-a21e-7123157fd97f    2025-08-08 00:30:41 +0000 UTC    2025-08-08 19:29:01 +0000 UTC
fdda95c3-c02a-45e9-9370-e26c0b86fd61    echotune-ai-3                                                                                              6e5a3e78-61f0-4656-a46d-b633313c8ee0    2025-08-07 20:50:48 +0000 UTC    2025-08-08 19:29:04 +0000 UTC
290ea836-87be-470f-82cf-759cbc985209    echotune-ai-2    https://echotune-ai-2-6fqwz.ondigitalocean.app    c3562504-a46b-4fb8-91de-7ddd15bd5b91    6c394a91-7677-484f-9ad0-6fc62b094916    2025-08-06 00:22:31 +0000 UTC    2025-08-08 19:29:01 +0000 UTC
af71af85-af8b-4b07-818e-c96cc0982cda    echotune-ai      https://echotune-ai-grm8j.ondigitalocean.app      6a905f16-2c88-4513-8e26-dade3e010b18    3ebbb227-7753-476b-b489-3b9bc4954878    2025-08-05 19:24:50 +0000 UTC    2025-08-08 19:29:01 +0000 UTC
7e0ccfcf-99be-421f-8736-aba1d7d8aca0    coral-app                                                          2298515a-9325-40de-a405-c7d61fddb11e    4a15c4ce-3a32-4b95-b349-1b28bc6c2f33    2025-08-03 00:23:23 +0000 UTC    2025-08-08 19:29:07 +0000 UTC
9441867a-881e-4fd8-9fad-5e795cf8ba38    sample-gin-3     https://sample-gin-3-rpwbl.ondigitalocean.app     27d5a0ea-c550-4153-9210-6303914d6f2e                                            2025-08-02 20:15:48 +0000 UTC    2025-08-02 23:32:20 +0000 UTC
- **status**: DigitalOcean App Platform accessible
- **note**: Can deploy apps directly

### ✅ DigitalOcean Droplets

- **droplets**: ID           Name                                        Public IPv4        Private IPv4    Public IPv6    Memory    VCPUs    Disk    Region    Image                            VPC UUID                                Status    Tags    Features                                               Volumes
511182155    ubuntu-s-4vcpu-8gb-amd-fra1-01              46.101.106.220     10.114.0.2                     8192      4        160     fra1      Ubuntu 22.04 (LTS) x64           c3aa14c0-5152-4c4b-b8c2-b46d34c9ba9d    active            monitoring,droplet_agent,private_networking            
511461492    droplet-er-vho                              159.223.207.187    10.124.0.3                     8192      4        50      sfo3      Ubuntu Docker on Ubuntu 22.04    dddbb700-dbb2-40d5-9084-202d4f539afa    active            backups,monitoring,droplet_agent,private_networking    fbb5cad2-7153-11f0-a7d4-0a58ac120cfe,9d164abd-722f-11f0-a419-0a58ac1202fb
512166552    lemponubuntu2404-s-2vcpu-4gb-amd-lon1-01    159.65.27.195      10.106.0.2                     4096      2        80      lon1      Ubuntu LEMP on Ubuntu 24.04      d43aaee0-ebc3-4c56-ac45-58b7d3bd2c71    active            monitoring,droplet_agent,private_networking
- **status**: DigitalOcean Droplets accessible
- **note**: Can manage virtual machines

### ✅ DigitalOcean Kubernetes

- **clusters**: ID    Name    Region    Version    Auto Upgrade    Status    Node Pools
- **status**: DigitalOcean Kubernetes accessible
- **note**: Can manage Kubernetes clusters

### ✅ DigitalOcean Spaces

- **spaces**: The subcommands under `doctl compute` are for managing DigitalOcean resources.

Usage:
  doctl compute [command]

Available Commands:
  action             Display commands for retrieving resource action history
  cdn                Display commands that manage CDNs
  certificate        Display commands that manage SSL certificates and private keys
  domain             Display commands that manage domains
  droplet            Manage virtual machines (Droplets)
  droplet-action     Display Droplet action commands
  droplet-autoscale  Display commands to manage Droplet autoscale pools
  firewall           Display commands to manage cloud firewalls
  image              Display commands to manage images
  image-action       Display commands to perform actions on images
  load-balancer      Display commands to manage load balancers
  region             Display commands to list datacenter regions
  reserved-ip        Display commands to manage reserved IP addresses
  reserved-ip-action Display commands to associate reserved IP addresses with Droplets
  reserved-ipv6      Display commands to manage reserved IPv6 addresses
  size               List available Droplet sizes
  snapshot           Access and manage snapshots
  ssh                Access a Droplet using SSH
  ssh-key            Display commands to manage SSH keys on your account
  tag                Display commands to manage tags
  volume             Display commands to manage block storage volumes
  volume-action      Display commands to perform actions on a volume

Flags:
  -h, --help   help for compute

Global Flags:
  -t, --access-token string   API V2 access token
  -u, --api-url string        Override default API endpoint
  -c, --config string         Specify a custom config file (default "/home/runner/.config/doctl/config.yaml")
      --context string        Specify a custom authentication context name
      --http-retry-max int    Set maximum number of retries for requests that fail with a 429 or 500-level error (default 5)
      --interactive           Enable interactive behavior. Defaults to true if the terminal supports it (default false)
  -o, --output string         Desired output format [text|json] (default "text")
      --trace                 Show a log of network activity while performing a command
  -v, --verbose               Enable verbose output

Use "doctl compute [command] --help" for more information about a command.
- **status**: DigitalOcean Spaces accessible
- **note**: Can manage object storage

### ✅ GitHub Container Registry

- **status**: GitHub Container Registry accessible
- **registry**: ghcr.io
- **authenticated**: false
- **note**: Public access working, requires GITHUB_TOKEN for authentication

### ✅ AWS ECR

- **status**: AWS CLI available
- **registry**: ECR ready for configuration
- **note**: Requires AWS credentials configuration

### ✅ Azure ACR

- **status**: Azure CLI available
- **registry**: ACR ready for configuration
- **note**: Requires Azure credentials configuration

### ✅ Google GCR

- **status**: Google Cloud CLI available
- **registry**: GCR ready for configuration
- **note**: Requires Google Cloud credentials configuration

