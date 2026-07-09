# Local Running & Deployment Guide

This guide walks you through launching and verifying **Raise2Solve** locally using both **Docker Compose** (Phase 1) and **k3d / Kubernetes** (Phase 2).

---

## Phase 1: Local Multi-Container Run with Docker Compose

### Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) (which includes Docker Engine and Docker Compose).

### Step-by-Step Instructions

1. **Verify your working directory:**
   Make sure you are in the root directory of the application:
   ```bash
   cd Raise2slove
   ```

2. **Copy Environment configuration:**
   Copy the sample environment configurations for reference or testing:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. **Build and start all services:**
   Build the Docker images for backend and frontend, and spin up the MongoDB database in the background:
   ```bash
   docker compose up --build -d
   ```

4. **Verify running containers:**
   Check the status of the containers:
   ```bash
   docker compose ps
   ```
   You should see `raise2solve-frontend`, `raise2solve-backend`, and `raise2solve-mongodb` running successfully.

5. **Verify Endpoint Accessibility:**
   - **Frontend application:** Navigate to `http://localhost:8080` in your web browser.
   - **Backend health checks:** Visit `http://localhost:5000/health` or run:
     ```bash
     curl http://localhost:5000/health
     ```

6. **Shutting down:**
   To stop the environment and remove volumes, run:
   ```bash
   docker compose down -v
   ```

---

## Phase 2: Local Kubernetes Deployment with k3d

### Prerequisites
- Install [k3d](https://k3d.io/) (requires Docker running).
- Install [kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/).

### Step-by-Step Instructions

1. **Create the local k3d cluster:**
   Run the following command to create a cluster that maps load-balancer port `8080` on your host to the Kubernetes ingress port `80`:
   ```bash
   k3d cluster create raise2solve-cluster -p "8080:80@loadbalancer"
   ```

2. **Build and import Docker images into k3d:**
   Since images are local and not yet pushed to an external registry:
   ```bash
   # Build images locally
   docker build -t raise2solve/frontend:latest .
   docker build -t raise2solve/backend:latest ./backend
   
   # Import them into your k3d cluster
   k3d image import raise2solve/frontend:latest -c raise2solve-cluster
   k3d image import raise2solve/backend:latest -c raise2solve-cluster
   ```

3. **Set up Secrets configuration:**
   Create a secret from `k8s/base/secret.example.yaml`:
   ```bash
   cp k8s/base/secret.example.yaml k8s/base/secret.yaml
   ```
   *(Optional)* Edit `k8s/base/secret.yaml` to configure your own JWT secrets. Make sure `kustomization.yaml` references `secret.yaml` instead of `secret.example.yaml` if you rename it.

4. **Deploy all manifests using Kustomize:**
   ```bash
   kubectl apply -k k8s/overlays/dev
   ```

5. **Wait and verify resources:**
   Verify the status of pods, services, and ingresses in the `raise2solve` namespace:
   ```bash
   kubectl get pods -n raise2solve
   kubectl get svc -n raise2solve
   kubectl get ingress -n raise2solve
   ```
   Wait until all pods show `Running`.

6. **Configure Local Host Routing:**
   Map `raise2solve.local` to your local host IP. Add the following line to your hosts file (Windows: `C:\Windows\System32\drivers\etc\hosts`):
   ```text
   127.0.0.1 raise2solve.local
   ```

7. **Test Local Route access:**
   - Access the Frontend: `http://raise2solve.local:8080`
   - Access the Backend health status: `http://raise2solve.local:8080/api/health`

8. **Tear down the cluster:**
   To clean up, destroy the k3d cluster:
   ```bash
   k3d cluster delete raise2solve-cluster
   ```
