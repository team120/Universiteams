# Initialize terraform

```bash
terraform init
```

# [Optional] Update or create if not exists terraform.tfvars file

> Use `terraform.tfvars.example` as template

```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

# Preview terraform execution plan

```bash
terraform plan
```

# Apply terraform plan

```bash
terraform apply -auto-approve
```

# Connect to server

```bash
ssh -i ~/.ssh/id_rsa root@$(terraform output -raw server_ip)
```
