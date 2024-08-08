variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "pvt_key" {
  description = "The file path to the private SSH key"
  type        = string
  sensitive   = true
}

variable "digitalocean_ssh_key_name" {
  description = "The name of the SSH key to import"
  default     = "universiteams-public-ssh-key"
}

variable "name" {
  description = "Name of the droplet"
  default     = "universiteams"
}

variable "region" {
  description = "The region to deploy resources to"
  type        = string
  default     = "nyc1"
}

variable "droplet_image" {
  description = "The unique slug that identifies the Droplet image"
  default     = "docker-20-04"
}

variable "size" {
  description = "The unique slug that identifies the Droplet size"
  default     = "s-1vcpu-1gb-amd"
}

variable "monitoring" {
  description = "Whether or not to install the monitoring agent"
  default     = true
}

variable "backups" {
  description = "Whether or not to enable backups"
  default     = true
}

variable "ipv6" {
  description = "Whether or not to enable IPv6 networking"
  default     = false
}
