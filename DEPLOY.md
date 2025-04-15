# Deployment Instructions

This repository is configured with GitHub Actions for manual deployment to the production server. The deployment workflow uses SSH key authentication with proven GitHub Actions to securely deploy code to the server at `63.142.251.137` in the directory `/root/tse-easiidesk-drivops-cicd`.

## Environment Variables

The deployment workflow uses the following environment variables configured in the workflow file:

- `SERVER_IP`: The IP address of the deployment server (currently set to `63.142.251.137`)
- `DEPLOY_PATH`: The target directory on the server (currently set to `/root/tse-easiidesk-drivops-cicd`)

To change these values, simply update the variables at the top of the `.github/workflows/deploy.yml` file.

## Prerequisites

Before the deployment workflow can work, you need to:

1. Add an SSH private key to GitHub Secrets
2. Ensure the server has the corresponding public key in authorized_keys
3. Ensure the server is properly configured to accept deployments

## Setting up SSH Keys

1. Generate an SSH key pair for deployment:
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy" -f deploy_key
   ```

2. Add the public key to the server's authorized keys:
   ```bash
   # Copy the content of deploy_key.pub
   cat deploy_key.pub
   
   # On the server (as root)
   echo "copied-public-key-content" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

3. Add the private key to GitHub Secrets:
   - Go to your repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `SSH_PRIVATE_KEY`
   - Value: The entire content of the private key file (deploy_key)
   - Make sure to include the entire key including the BEGIN and END lines

## Server Configuration

Ensure the server has the following prerequisites:

1. SSH server properly configured to allow public key authentication
2. Node.js and npm installed
3. Forever package installed globally:
   ```bash
   npm install -g forever
   ```

4. Create the deployment directory:
   ```bash
   mkdir -p /root/tse-easiidesk-drivops-cicd
   ```

5. Set appropriate permissions:
   ```bash
   chown -R root:root /root/tse-easiidesk-drivops-cicd
   chmod -R 755 /root/tse-easiidesk-drivops-cicd
   ```

## How to Deploy

To deploy the application:

1. Go to the "Actions" tab in your GitHub repository
2. Select the "Deploy to Production" workflow
3. Click "Run workflow"
4. Select the branch you want to deploy
5. Click "Run workflow"

The deployment process will:
- Checkout the code from GitHub
- Set up Node.js environment
- Install dependencies
- Run the build script (if present)
- Set up SSH with the provided private key
- Copy the repository files to the server using rsync
- Install production dependencies on the server
- Restart the application using Forever

## Post-Deployment Configuration

After the first deployment, you may need to:

1. Set up environment variables:
   ```bash
   cd /root/tse-easiidesk-drivops-cicd
   cp .env.example .env
   nano .env  # Edit with your production values
   ```

2. Manage your Forever processes:
   ```bash
   # List all running processes
   forever list
   
   # Stop a specific process
   forever stop app.js
   
   # Start with specific environment variables
   forever start -a -l forever.log -o out.log -e err.log app.js
   ```

## Troubleshooting

If deployments fail, check:

1. GitHub Actions logs for error messages
2. SSH key configuration:
   - Make sure the private key in GitHub Secrets is correct and complete
   - Ensure the corresponding public key is in the server's /root/.ssh/authorized_keys file
   - Check permissions on the server's /root/.ssh directory (should be 700)
   - Check permissions on the server's /root/.ssh/authorized_keys file (should be 600)
3. SSH server configuration: 
   - Check /etc/ssh/sshd_config for proper settings
   - Make sure PubkeyAuthentication is set to yes
4. Permissions: Ensure the root user has write access to the deployment directory
5. Build process: Check if there are any errors during the build step
6. Forever status: Run `forever list` on the server to check running processes

For more detailed troubleshooting, you can add the -v flag to the rsync command in the workflow file to get verbose output.

For more help, contact the DevOps team. 