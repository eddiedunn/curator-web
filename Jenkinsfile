pipeline {
    agent { label 'linux && gpu && compute' }

    environment {
        SONAR_HOST_URL    = 'http://127.0.0.1:9200'
        SONAR_PROJECT_KEY = 'curator-web'
        TRIVY_CACHE_DIR   = '/opt/trivy/cache'
        DEPLOY_PLAYBOOK   = 'deploy/ansible-deploy.yml'
        BUN_BIN           = '/home/eddie/.bun/bin/bun'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Trivy Security Scan') {
            steps {
                sh '/usr/bin/trivy fs --cache-dir "${TRIVY_CACHE_DIR}" --exit-code 1 --severity HIGH,CRITICAL --scanners vuln,secret --format table --skip-dirs node_modules --skip-dirs dist .'
            }
        }

        stage('Build') {
            steps {
                sh '"${BUN_BIN}" install --frozen-lockfile'
                sh '"${BUN_BIN}" run build'
            }
        }

        stage('SonarQube Analysis') {
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
                sh 'ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook -i "127.0.0.1," "${DEPLOY_PLAYBOOK}" --connection local -e "curator_web_src_dir=${WORKSPACE}"'
            }
        }
    }

    post {
        always { deleteDir() }
        success { echo 'Pipeline completed successfully.' }
        failure { echo 'Pipeline failed.' }
    }
}
