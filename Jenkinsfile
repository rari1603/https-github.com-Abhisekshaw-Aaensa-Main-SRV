pipeline {
    agent any
    environment {
        AWS_REGION = 'us-east-1'
        AMI_ID = 'ami-0ec4d486e6090b9b7'
        INSTANCE_TYPE = 't2.medium'
        SECURITY_GROUP_ID = 'sg-04fef18292db184c1'
        INSTANCE_NAME = 'new_emi_test'
        KEY_NAME = 'emi-key'
        SUBNET_ID = 'subnet-08f6b27a056e0fe2c'
        PRIVATE_IP_FILE = '/home/ubuntu/private_ip.txt'  // Path to store the private IP
    }
    stages {
        stage('Launch EC2 Instance') {
            steps {
                script {
                    withCredentials([
                        string(credentialsId: 'aws-access', variable: 'AWS_ACCESS_KEY_ID'),
                        string(credentialsId: 'aws-secret', variable: 'AWS_SECRET_ACCESS_KEY'),
                        string(credentialsId: 'aws-session-token', variable: 'AWS_SESSION_TOKEN')
                    ]) {
                        def instanceId = sh(
                            script: '''
                                aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID
                                aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
                                aws configure set aws_session_token $AWS_SESSION_TOKEN
                                aws configure set default.region $AWS_REGION

                                aws ec2 run-instances \
                                    --image-id $AMI_ID \
                                    --instance-type $INSTANCE_TYPE \
                                    --key-name $KEY_NAME \
                                    --security-group-ids $SECURITY_GROUP_ID \
                                    --subnet-id $SUBNET_ID \
                                    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$INSTANCE_NAME}]" \
                                    --query 'Instances[0].InstanceId' \
                                    --output text
                            ''', 
                            returnStdout: true
                        ).trim()

                        echo "Instance ID: ${instanceId}"

                        // Wait for the instance to be in 'running' state
                        sh """
                            aws ec2 wait instance-running --instance-ids ${instanceId}
                        """

                        // Fetch the private IP of the instance
                        def privateIp = sh(
                            script: """
                                aws ec2 describe-instances \
                                    --instance-ids ${instanceId} \
                                    --query 'Reservations[0].Instances[0].PrivateIpAddress' \
                                    --output text
                            """, 
                            returnStdout: true
                        ).trim()

                        echo "Private IP Address: ${privateIp}"

                        // Write the private IP to a file
                        writeFile file: PRIVATE_IP_FILE, text: privateIp

                        // Trigger the second pipeline and pass the private IP
                        build job: 'ec2 build', parameters: [string(name: 'INSTANCE_PRIVATE_IP', value: privateIp)]
                    }
                }
            }
        }
    }
    post {
        always {
            echo "Pipeline completed. Check the logs for details."
        }
    }
}
