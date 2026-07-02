pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        SONAR_TOKEN           = credentials('sonar-token')
        IMAGE_NAME            = "brbrbr9314/tasklist-backend"
        IMAGE_TAG             = "${env.BUILD_NUMBER}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // On saute les étapes npm locales. 
        // Le 'docker build' ci-dessous va exécuter le 'npm ci' et 'npm run build' de manière isolée dans le conteneur.
        stage('Build Docker image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest .'
            }
        }

        stage('Trivy scan (image)') {
            steps {
                sh '''
                    trivy image --exit-code 0 --severity HIGH,CRITICAL \
                        --format table $IMAGE_NAME:$IMAGE_TAG | tee trivy-report.txt
                '''
            }
            post {
                always {
                    // On force l'archivage dans le contexte de l'exécuteur courant
                    node {
                        archiveArtifacts artifacts: 'trivy-report.txt', allowEmptyArchive: true
                    }
                }
            }
        }

        stage('Generate SBOM (SPDX)') {
            steps {
                sh 'trivy image --format spdx-json --output sbom-spdx.json $IMAGE_NAME:$IMAGE_TAG'
            }
            post {
                always {
                    node {
                        archiveArtifacts artifacts: 'sbom-spdx.json', allowEmptyArchive: true
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh '''
                    echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin
                    docker push $IMAGE_NAME:$IMAGE_TAG
                    docker push $IMAGE_NAME:latest
                '''
            }
        }
    }
}