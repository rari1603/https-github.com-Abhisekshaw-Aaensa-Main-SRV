pipeline {
    agent any
    environment {
        GIT_REPO_URL = 'github.com/rari1603/https-github.com-Abhisekshaw-Aaensa-Main-SRV.git'
        GIT_BRANCH = 'main'
        VM_USERNAME = 'ubuntu'
        VM_IP = '192.168.7.238'
        SSH_CREDENTIAL_ID = '1'
        VM_PATH = '/home/ubuntu/Aaensa-Main-SRV'
    }
 
    stages {
        stage('Pull Latest Code from GitHub') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'github-token', variable: 'GITHUB_TOKEN')]) {
                        try {
                            sshagent([SSH_CREDENTIAL_ID]) {
                                sh """
                                    ssh -o StrictHostKeyChecking=no ${VM_USERNAME}@${VM_IP} << 'EOF'
                                    set -x  # Enable debugging
                                    export GITHUB_TOKEN='${GITHUB_TOKEN}'
                                    cd ${VM_PATH}  
                                    git remote set-url origin https://\$GITHUB_TOKEN@${GIT_REPO_URL}
                                    git pull
                                    git reset --hard origin/${GIT_BRANCH}
                                    exit 0
                                    EOF
                                """
                            }
                        } catch (Exception e) {
                            error "Failed to pull the latest code from GitHub: ${e.getMessage()}"
                        }
                    }
                }
            }
        }
        stage('Install Dependencies and Start pm2 Service') {
            steps {
                script {
                    sshagent([SSH_CREDENTIAL_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${VM_USERNAME}@${VM_IP} << 'EOF'
                            set -x  # Enable debugging
                            cd ${VM_PATH}
                            npm install 
                            pm2 start index.js --name E1 -f
                            exit 0
                            EOF
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            echo "Pipeline completed. Check the logs for details."
        }
        failure {
            echo "Pipeline failed. Check the logs for details."
        }
    }
}
