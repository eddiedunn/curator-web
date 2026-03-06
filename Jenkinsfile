pipeline {
    agent { label 'linux && gpu && compute' }

    environment {
        SONAR_HOST_URL    = 'http://127.0.0.1:9200'
        SONAR_PROJECT_KEY = 'curator-web'
        DEPLOY_PLAYBOOK   = 'deploy/ansible-deploy.yml'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Trivy Security Scan') {
            agent {
                docker {
                    image 'aquasec/trivy:latest'
                    reuseNode true
                    args '--entrypoint="" -u root --network host -v /opt/trivy/cache:/root/.cache/trivy'
                }
            }
            steps {
                sh '''trivy fs \
                    --exit-code 1 \
                    --severity HIGH,CRITICAL \
                    --scanners vuln,secret \
                    --format table \
                    --skip-dirs node_modules \
                    --skip-dirs dist \
                    .'''
            }
        }

        stage('Build') {
            agent {
                docker {
                    image 'oven/bun:1'
                    reuseNode true
                    args '-u root --network host'
                }
            }
            steps {
                sh 'bun install --frozen-lockfile'
                sh 'bun run build'
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'sonarsource/sonar-scanner-cli:latest'
                    reuseNode true
                    args '-u root --network host'
                }
            }
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token-curator-web', variable: 'SONAR_TOKEN')]) {
                    sh '''sonar-scanner \
                        -Dsonar.projectKey="${SONAR_PROJECT_KEY}" \
                        -Dsonar.sources=src \
                        -Dsonar.exclusions=node_modules/**,dist/** \
                        -Dsonar.host.url="${SONAR_HOST_URL}" \
                        -Dsonar.token="${SONAR_TOKEN}"'''
                }
            }
        }

        stage('Deploy') {
            steps {
                sh '''ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook \
                    -i "127.0.0.1," \
                    "${DEPLOY_PLAYBOOK}" \
                    --connection local \
                    -e "curator_web_src_dir=${WORKSPACE}"'''
            }
        }
    }

    post {
        always {
            deleteDir()
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed.'
        }
    }
}
