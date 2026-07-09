# Raise2Solve Infrastructure as Code (Terraform)

This folder contains modular Terraform configuration code to deploy EKS, VPC, ECR, S3, and IAM roles for the Raise2Solve web application.

## Prerequisites
- Install [Terraform CLI](https://developer.hashicorp.com/terraform/downloads).
- Configure your AWS credentials via environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, etc.) or AWS Profiles.

## Folder Layout

```
raise2solve-infra/
├── modules/
│   ├── vpc/             # VPC, subnets, IGW, NAT Gateways
│   ├── eks/             # Cluster and worker node group provisioning
│   ├── ecr/             # Elastic Container Registry setup
│   ├── s3/              # S3 assets bucket
│   └── iam/             # IRSA configuration mapping IAM roles to ServiceAccounts
└── environments/
    └── dev/             # Environment configurations
```

## How to Deploy (dev)

1. Navigate to the development environment directory:
   ```bash
   cd environments/dev
   ```

2. Initialize Terraform and download the provider plugins:
   ```bash
   terraform init
   ```

3. Generate a plan and inspect planned changes:
   ```bash
   terraform plan
   ```

4. Apply the configuration (this takes ~10-15 minutes due to EKS cluster build times):
   ```bash
   terraform apply -auto-approve
   ```

5. Once complete, retrieve EKS configuration settings:
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name raise2solve-eks-dev
   ```

## Tearing Down
To clean up resources and prevent unexpected billing:
```bash
terraform destroy -auto-approve
```
