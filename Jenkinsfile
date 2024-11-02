pipeline {
    agent any // any agent can run this job

    stages {
        stage('Echo Hello World') {
            steps {
                echo 'Hello World'
            }
        }
    }
    post {
        always {
            cleanWs() // clean workspace when done
        }
    }
}
