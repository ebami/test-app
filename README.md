# Socket.io Chat App - React + Node.js with Azure Deployment

A real-time chat application built with React, Node.js, Express, and Socket.io, with automated deployment to Azure.

## 🏗️ Project Structure

```
test-app/
├── client/                    # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── hooks/
│   │   │   └── useSocket.js   # Socket.io React hook
│   │   ├── App.js             # Main chat component
│   │   ├── App.css            # Styles
│   │   ├── index.js           # Entry point
│   │   └── socket.js          # Socket.io client setup
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── src/
│   │   ├── socket/
│   │   │   └── handlers.js    # Socket event handlers
│   │   └── index.js           # Express + Socket.io server
│   └── package.json
│
├── infrastructure/            # Azure deployment
│   ├── arm-template.json      # Azure resource template
│   ├── deploy.sh              # Bash deployment script
│   └── deploy.ps1             # PowerShell deployment script
│
├── .github/workflows/         # CI/CD
│   ├── deploy-backend.yml     # Backend deployment
│   └── deploy-frontend.yml    # Frontend deployment
│
└── package.json               # Root package with scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend: http://localhost:3001
   - Frontend: http://localhost:3000

3. **Open the app** in your browser at http://localhost:3000

## 💬 Features

- Real-time messaging with Socket.io
- User join/leave notifications
- Online users list
- Typing indicators
- Responsive design
- Connection status indicator

## ☁️ Azure Deployment

### Option 1: Automated Script

**PowerShell (Windows):**
```powershell
cd infrastructure
.\deploy.ps1 -ResourceGroup "my-chat-app-rg" -AppName "mychatapp"
```

**Bash (Linux/Mac):**
```bash
cd infrastructure
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment

1. **Create Azure Resources:**
   ```bash
   az group create --name socket-chat-rg --location eastus
   
   az deployment group create \
     --resource-group socket-chat-rg \
     --template-file infrastructure/arm-template.json \
     --parameters appName=socketchat clientUrl="https://your-app.azurestaticapps.net"
   ```

2. **Configure GitHub Secrets:**
   | Secret | Description |
   |--------|-------------|
   | `AZURE_CREDENTIALS` | Service principal JSON |
   | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Static Web Apps token |
   | `AZURE_RESOURCE_GROUP` | Resource group name |
   | `REACT_APP_SOCKET_URL` | Backend URL |
   | `CLIENT_URL` | Frontend URL |

3. **Push to main branch** to trigger deployment

### Azure Resources Created

| Resource | Type | Purpose |
|----------|------|---------|
| App Service Plan | B1 Linux | Hosts backend |
| App Service | Node.js | Backend API + WebSocket |
| Static Web App | Free | React frontend |

## 🔧 Configuration

### Environment Variables

**Backend (.env):**
```env
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

**Frontend (.env):**
```env
REACT_APP_SOCKET_URL=http://localhost:3001
```

## 📡 Socket Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `user:join` | `username` | Join chat with username |
| `message:send` | `{ text }` | Send a message |
| `user:typing` | `boolean` | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `users:list` | `[{ id, username }]` | Current users |
| `user:joined` | `{ id, username, userCount }` | New user joined |
| `user:left` | `{ id, username, userCount }` | User left |
| `message:received` | `{ id, userId, username, text, timestamp }` | New message |
| `user:typing` | `{ userId, username, isTyping }` | Typing status |

## 📝 License

MIT
