# Complete Production Deployment Guide

This guide details the exact sequential commands and procedures to run Raise2Solve locally and deploy it on AWS EKS using Terraform, GitHub Actions, S3, and Argo CD.

---

## 🛠️ Phase 1 & 2: Local Verification (Docker Compose & k3d)

Follow these steps to check that the application works locally. Refer to [local_running_guide.md](file:///e:/deployment_tut/Raise2slove/docs/local_running_guide.md) for full commands.

1. **Test Docker Compose:**
   ```bash
   cd Raise2slove
   docker compose up --build -d
   ```
   - Verify Frontend: `http://localhost:8080`
   - Verify Backend Health: `http://localhost:5000/health`
   - Stop Compose: `docker compose down -v`

2. **Test Kubernetes (k3d):**
   ```bash
   # Create Cluster
   k3d cluster create raise2solve-cluster -p "8080:80@loadbalancer"
   
   # Build & Load Images
   docker build -t raise2solve/frontend:latest .
   docker build -t raise2solve/backend:latest ./backend
   k3d image import raise2solve/frontend:latest raise2solve/backend:latest -c raise2solve-cluster
   
   # Deploy
   kubectl apply -k k8s/overlays/dev
   ```

---

## ☁️ Phase 3: Setup AWS Repositories & GitHub OIDC Roles

Before running CI/CD or Terraform, configure AWS OIDC to allow GitHub Actions to build and push images safely without using credentials keys.

1. **Create ECR Repositories via AWS CLI:**
   ```bash
   aws ecr create-repository --repository-name raise2solve/frontend --region us-east-1
   aws ecr create-repository --repository-name raise2solve/backend --region us-east-1
   ```

2. **Deploy OIDC Identity Provider on AWS:**
   Create an IAM Identity Provider for GitHub OIDC in your AWS Console (Provider URL: `https://token.actions.githubusercontent.com`, Audience: `sts.amazonaws.com`).

3. **Configure IAM Role for GitHub Actions OIDC:**
   Attach a trust policy to a new role named `raise2solve-github-actions-oidc-role` allowing STS assumption from your repo:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "Federated": "arn:aws:iam::YOUR_AWS_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
         },
         "Action": "sts:AssumeRoleWithWebIdentity",
         "Condition": {
           "StringEquals": {
             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
           },
           "StringLike": {
             "token.actions.githubusercontent.com:repo": "YOUR_GITHUB_ORG/YOUR_REPO:*"
           }
         }
       }
     ]
   }
   ```
   Attach policies allowing `ecr:GetAuthorizationToken`, `ecr:BatchPushImage`, and `ecr:BatchCheckLayerAvailability`.

---

## 🏗️ Phase 4: Deploy EKS Infrastructure with Terraform

1. **Navigate to the dev environments directory:**
   ```bash
   cd raise2solve-infra/environments/dev
   ```

2. **Initialize and run Terraform:**
   ```bash
   terraform init
   terraform plan
   terraform apply -auto-approve
   ```
   *Note: EKS cluster build takes 10–15 minutes.*

3. **Configure local kubeconfig:**
   Connect your kubectl utility to the new cluster:
   ```bash
   aws eks update-kubeconfig --region us-east-1 --name raise2solve-eks-dev
   ```

---

## 🚀 Phase 5: Install AWS Load Balancer Controller

Install the AWS ALB Ingress Controller so that Ingress resources automatically provision an AWS Application Load Balancer.

1. **Add Helm repository:**
   ```bash
   helm repo add eks https://aws.github.io/eks-charts
   helm repo update
   ```

2. **Associate IAM Policy to the Load Balancer Controller:**
   Download the AWS ALB Controller policy and create a service account associated with the EKS OIDC provider:
   ```bash
   curl -O https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
   
   aws iam create-policy \
     --policy-name AWSLoadBalancerControllerIAMPolicy \
     --policy-document file://iam_policy.json
   
   # Associate role using eksctl (or use IAM module ARN output)
   eksctl create iamserviceaccount \
     --cluster=raise2solve-eks-dev \
     --namespace=kube-system \
     --name=aws-load-balancer-controller \
     --role-name raise2solve-alb-controller-role \
     --attach-policy-arn=arn:aws:iam::YOUR_AWS_ACCOUNT_ID:policy/AWSLoadBalancerControllerIAMPolicy \
     --approve \
     --region=us-east-1
   ```

3. **Install ALB Controller via Helm:**
   ```bash
   helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
     -n kube-system \
     --set clusterName=raise2solve-eks-dev \
     --set serviceAccount.create=false \
     --set serviceAccount.name=aws-load-balancer-controller
   ```

---

## 📦 Phase 6: Move Asset Uploads to S3

The application's backend controller [service.controller.js](file:///e:/deployment_tut/Raise2slove/backend/controllers/service.controller.js) is already updated to route images directly to S3. To configure this:

1. **Configure Environment Variables:**
   Provide the following parameters inside your Kubernetes ConfigMap:
   - `S3_BUCKET_NAME`: The name of the S3 bucket provisioned by Terraform (found in `terraform output s3_bucket_name`).
   - `AWS_REGION`: `us-east-1`

2. **IRSA Activation:**
   The backend service account `raise2solve-backend-sa` is already annotated to assume the IAM role with permissions to read and write to your private bucket.

---

## 🔄 Phase 7: Setup GitOps with Argo CD

Deploy Argo CD to automate the synchronizations between your Git repository and EKS.

1. **Install Argo CD:**
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```

2. **Expose Argo CD server (optional/local port-forward):**
   ```bash
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```
   Access at `https://localhost:8080`. User: `admin`. Password can be fetched using:
   ```bash
   kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
   ```

3. **Register application in Argo CD:**
   Apply the dev application manifest to start tracking repository configurations:
   ```bash
   kubectl apply -f raise2solve-gitops/argocd/dev-application.yaml
   ```

---

## 🧹 Phase 8: Teardown Infrastructure

To avoid running costs:

1. **Delete GitOps App:**
   ```bash
   kubectl delete -f raise2solve-gitops/argocd/dev-application.yaml
   ```

2. **Destroy AWS Infrastructure:**
   ```bash
   cd raise2solve-infra/environments/dev
   terraform destroy -auto-approve
   ```
