data "digitalocean_ssh_key" "universiteams-public-ssh-key" {
  name = var.digitalocean_ssh_key_name
}

data "template_file" "cloud_config" {
  template = file("${path.module}/templates/cloud-config.yml")
}

resource "digitalocean_droplet" "instance" {
  name   = format("%s-%s-1", var.name, var.region)
  image  = var.droplet_image
  size   = var.size
  region = var.region
  ssh_keys = [
    data.digitalocean_ssh_key.universiteams-public-ssh-key.id
  ]

  monitoring = var.monitoring
  backups    = var.backups
  ipv6       = var.ipv6

  connection {
    host        = self.ipv4_address
    user        = "root"
    type        = "ssh"
    private_key = file(var.pvt_key)
    timeout     = "2m"
  }

  user_data = data.template_file.cloud_config.rendered

  # Outputs cloud-init and waits for the boot to finish before allowing the
  # resource to be considered created. This asserts SSH connectivity can be
  # established and cloud-init is reporting as expected, tainting on failure.
  provisioner "remote-exec" {
    inline = [
      "test -f /var/log/cloud-init-output.log",
      "tail -f /var/log/cloud-init-output.log &",
      "until [ -f /var/lib/cloud/instance/boot-finished ]; do sleep 1; done",
    ]
  }
}

output "server_ip" {
  value = digitalocean_droplet.instance.ipv4_address
}
