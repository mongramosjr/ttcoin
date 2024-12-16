### Development environment for TON smart contract development using FunC IDE in Linux with GoLand.

**Prerequisites:**
1. Linux distribution (Ubuntu/Debian recommended)
2. GoLand IDE
3. Git
4. Basic development tools

**Step-by-Step Setup:**

### 1. Install Required Dependencies
First, update your system and install necessary tools:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y build-essential git cmake clang-14 libgflags-dev libssl-dev
sudo apt-get install libsecp256k1-dev
sudo apt-get install libsodium-dev
sudo apt-get install libmicrohttpd-dev
sudo apt-get install liburing-dev
sudo apt-get install texlive-full
sudo apt-get install libreadline-dev
sudo apt-get install libgsl-dev
sudo apt-get install ccache
sudo apt install npm
```

### 2. Install Rust (Required for TON Development Tools)
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
# Follow the on-screen prompts
source $HOME/.cargo/env
```

### 3. Install TONOS-CLI
```bash
git clone https://github.com/tonlabs/tonos-cli.git
cd tonos-cli
cargo update
cargo build --release
```

### 4. Install TON Development Tools
```bash
# Clone TON repositories
mkdir -p ~/ton-dev
cd ~/ton-dev

# Clone main TON repositories
git clone https://github.com/ton-blockchain/ton.git
```

### 5. Compile FunC Compiler
```bash
cd ~/ton-dev/ton
git submodule update --init --recursive
mkdir build
cp assembly/native/build-ubuntu-shared.sh .
chmod +x build-ubuntu-shared.sh
./build-ubuntu-shared.sh
```

### 6. Setup GoLand for TON Development
1. Open GoLand
2. Install "TON" plugin
   - File → Settings → Plugins
   - Search for "TON"
   - Install the plugin and restart GoLand
