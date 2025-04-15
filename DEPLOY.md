# Deployment Instructions

This repository is configured with GitHub Actions for manual deployment to the production server. The deployment workflow needs to be manually triggered to deploy code to the server at `63.142.251.137` in the directory `/root/tse-easiidesk-drivops`.

## Environment Variables

The deployment workflow uses the following environment variables configured in the workflow file:

- `SERVER_IP`: The IP address of the deployment server (currently set to `63.142.251.137`)
- `DEPLOY_PATH`: The target directory on the server (currently set to `/root/tse-easiidesk-drivops`)

To change these values, simply update the variables at the top of the `.github/workflows/deploy.yml` file.

## Prerequisites

Before the deployment workflow can work, you need to:

1. Add an SSH private key to GitHub Secrets
2. Ensure the server is properly configured to accept deployments

## Setting up GitHub Secrets

1. Generate an SSH key pair for deployment:
   ```bash
   ssh-keygen -t rsa -b 4096 -C "deployment-key" -f deployment_key
   ```

2. Add the public key to the server's authorized keys:
   ```bash
   # Copy the content of deployment_key.pub
   cat deployment_key.pub
   
   # On the server
   echo "copied-public-key-content" >> ~/.ssh/authorized_keys
   ```

3. Add the private key to GitHub repository secrets:
   - Go to your repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: Contents of `deployment_key` (the private key file)

## Server Configuration

Ensure the server has the following prerequisites:

1. Node.js and npm installed
2. PM2 process manager installed:
   ```bash
   npm install -g pm2
   ```

3. Create the deployment directory:
   ```bash
   mkdir -p /root/tse-easiidesk-drivops
   ```

4. Set appropriate permissions:
   ```bash
   chown -R root:root /root/tse-easiidesk-drivops
   chmod -R 755 /root/tse-easiidesk-drivops
   ```

## How to Deploy

To deploy the application:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Production" workflow
3. Click "Run workflow"
4. Select the branch you want to deploy
5. Click "Run workflow"

The deployment process will:
- Copy the repository files to the server
- Install production dependencies
- Restart the application using PM2

## Post-Deployment Configuration

After the first deployment, you may need to:

1. Set up environment variables:
   ```bash
   cd /root/tse-easiidesk-drivops
   cp .env.example .env
   nano .env  # Edit with your production values
   ```

2. Configure PM2 to start on boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Troubleshooting

If deployments fail, check:

1. GitHub Actions logs for error messages
2. SSH connectivity: Ensure you can connect manually using the same key
3. Permissions: Ensure the deployment user has write access to the deployment directory
4. PM2 status: Run `pm2 status` on the server to check if the app is running

For more help, contact the DevOps team. 