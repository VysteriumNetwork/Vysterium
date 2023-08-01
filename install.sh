git clone --depth 1 https://github.com/VysteriumNetwork/Vysterium-Static static
npm install
cert="https://donate.astroid.gg/ngg.crt"

wget -qO- $cert | sudo tee /usr/local/share/ca-certificates/ngg.crt
wget -qO- $cert | sudo tee /etc/ssl/ngg.crt
sudo update-ca-certificates
export NODE_EXTRA_CA_CERTS="/etc/ssl/ngg.crt"
echo "export NODE_EXTRA_CA_CERTS='/etc/ssl/ngg.crt'" >> ~/.bashrc
echo "5.161.68.227 now.gg" >> /etc/hosts

echo "Bypass implemented!"
echo "restart uv/node/pm2 to apply new env variable"
