// Jenkinsfile — CI pipeline for cars-frontend (Next.js + npm)
// Stages: Checkout -> Install -> Lint -> Test -> Build -> Archive
//
// Prerequisites in Jenkins:
//   1. NodeJS plugin installed, with a NodeJS installation named 'node20'
//      configured under: Manage Jenkins > Tools > NodeJS installations.
//      (Change the name in the tools{} block below if yours differs.)
//      --- OR ---
//      If Node.js is already on the build agent's PATH, you can delete the
//      whole tools{} block and the pipeline will use the system Node.
//
// The pipeline auto-detects Windows vs Unix agents (bat vs sh).

// Run a command on whichever OS the agent is (Windows -> bat, Unix -> sh).
def runCmd(String cmd) {
    if (isUnix()) {
        sh cmd
    } else {
        bat cmd
    }
}

pipeline {
    agent any

    // tools {
    //     nodejs 'node20'
    // }

    options {
        // Prefix log lines with timestamps.
        timestamps()
        // Never run two builds of this job at the same time.
        disableConcurrentBuilds()
        // Fail the build if it hangs.
        timeout(time: 20, unit: 'MINUTES')
        // Keep only the last 10 builds to save disk.
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        // Marks the build as non-interactive CI.
        CI = 'true'
        // Don't send Next.js telemetry from CI.
        NEXT_TELEMETRY_DISABLED = '1'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Tool versions') {
            steps {
                runCmd 'node --version'
                runCmd 'npm --version'
            }
        }

        stage('Install') {
            steps {
                // npm ci = clean, reproducible install straight from package-lock.json.
                runCmd 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                runCmd 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                // Runs the "test" script only if one exists; no-op otherwise.
                // (cars-frontend has no tests yet — this stage stays green until you add some.)
                runCmd 'npm run test --if-present'
            }
        }

        stage('Build') {
            steps {
                // Produces the production build in .next/
                runCmd 'npm run build'
            }
        }

        stage('Archive') {
            steps {
                // Save the build output (minus the rebuildable cache) as a build artifact.
                archiveArtifacts(
                    artifacts: '.next/**',
                    excludes: '.next/cache/**',
                    fingerprint: true,
                    onlyIfSuccessful: true
                )
            }
        }
    }

    post {
        success {
            echo '✅ cars-frontend pipeline succeeded.'
        }
        failure {
            echo '❌ cars-frontend pipeline failed — check the failing stage log above.'
        }
    }
}
