# Azure Deployment Script for Socket.io Chat App (PowerShell)
# This script provisions Azure resources and sets up the deployment

param(
    [string]$ResourceGroup = "socket-chat-rg",
    [string]$Location = "eastus",
    [string]$AppName = "socketchat"
)

$ErrorActionPreference = "Stop"

Write-Host "Socket.io Chat App - Azure Deployment Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Azure CLI is installed
if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed. Please install it first." -ForegroundColor Red
    Write-Host "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if logged in to Azure
Write-Host ""
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$loginCheck = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please login to Azure..." -ForegroundColor Yellow
    az login
}
$account = az account show | ConvertFrom-Json

Write-Host "Using subscription: $($account.name)" -ForegroundColor Green

# Create Resource Group
Write-Host ""
Write-Host "Creating Resource Group: $ResourceGroup" -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none
Write-Host "Resource Group created" -ForegroundColor Green

# Deploy ARM template
Write-Host ""
Write-Host "Deploying Azure resources..." -ForegroundColor Yellow
$deploymentOutput = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file ./arm-template.json `
    --parameters appName=$AppName clientUrl="https://placeholder.azurestaticapps.net" `
    --query "properties.outputs" `
    --output json | ConvertFrom-Json

# Extract outputs
$backendUrl = $deploymentOutput.backendUrl.value
$staticWebAppUrl = $deploymentOutput.staticWebAppUrl.value
$backendAppName = $deploymentOutput.backendAppName.value
$staticWebAppName = $deploymentOutput.staticWebAppName.value

Write-Host "Resources deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Resource URLs:" -ForegroundColor Cyan
Write-Host "   Backend API: $backendUrl" -ForegroundColor White
Write-Host "   Frontend: $staticWebAppUrl" -ForegroundColor White

# Get Static Web App deployment token
Write-Host ""
Write-Host "Getting Static Web App deployment token..." -ForegroundColor Yellow
$swaToken = az staticwebapp secrets list `
    --name $staticWebAppName `
    --resource-group $ResourceGroup `
    --query "properties.apiKey" `
    --output tsv

# Update backend CORS with actual Static Web App URL
Write-Host ""
Write-Host "Updating backend CORS settings..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $backendAppName `
    --settings CLIENT_URL=$staticWebAppUrl `
    --output none
Write-Host "CORS settings updated" -ForegroundColor Green

# Create service principal for GitHub Actions
Write-Host ""
Write-Host "Creating service principal for CI/CD..." -ForegroundColor Yellow
$subscriptionId = az account show --query id -o tsv
$spOutput = az ad sp create-for-rbac `
    --name "$AppName-github-actions" `
    --role contributor `
    --scopes "/subscriptions/$subscriptionId/resourceGroups/$ResourceGroup" `
    --sdk-auth

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Secrets to configure:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. AZURE_CREDENTIALS:" -ForegroundColor White
Write-Host $spOutput -ForegroundColor Gray
Write-Host ""
Write-Host "2. AZURE_STATIC_WEB_APPS_API_TOKEN:" -ForegroundColor White
Write-Host $swaToken -ForegroundColor Gray
Write-Host ""
Write-Host "3. AZURE_RESOURCE_GROUP:" -ForegroundColor White
Write-Host $ResourceGroup -ForegroundColor Gray
Write-Host ""
Write-Host "4. REACT_APP_SOCKET_URL:" -ForegroundColor White
Write-Host $backendUrl -ForegroundColor Gray
Write-Host ""
Write-Host "5. CLIENT_URL:" -ForegroundColor White
Write-Host $staticWebAppUrl -ForegroundColor Gray
Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Add the above secrets to your GitHub repository" -ForegroundColor White
Write-Host "2. Push code to main branch to trigger deployment" -ForegroundColor White
Write-Host "3. Backend: $backendUrl/api/health" -ForegroundColor White
Write-Host "4. Frontend: $staticWebAppUrl" -ForegroundColor White
Write-Host "==============================================" -ForegroundColor Cyan
