# Uso:
#   1. AWS Academy -> Learner Lab -> AWS Details -> AWS CLI: Show -> copiar o bloco [default]
#   2. .\scripts\aws-academy-refresh.ps1   (cola o bloco, Enter, Ctrl+Z + Enter para finalizar)
# Atualiza ~/.aws/credentials, a região default e os secrets AWS_* do repositório GitHub (via gh CLI).

$ErrorActionPreference = "Stop"

Write-Host "Cole o bloco [default] do AWS Details (finalize com Ctrl+Z + Enter):"
$block = [Console]::In.ReadToEnd()

if ($block -notmatch "aws_access_key_id\s*=\s*(\S+)") { throw "aws_access_key_id não encontrado no bloco colado" }
$accessKey = $Matches[1]
if ($block -notmatch "aws_secret_access_key\s*=\s*(\S+)") { throw "aws_secret_access_key não encontrado" }
$secretKey = $Matches[1]
if ($block -notmatch "aws_session_token\s*=\s*(\S+)") { throw "aws_session_token não encontrado" }
$sessionToken = $Matches[1]

# 1) ~/.aws/credentials
$awsDir = Join-Path $HOME ".aws"
New-Item -ItemType Directory -Force $awsDir | Out-Null
@"
[default]
aws_access_key_id = $accessKey
aws_secret_access_key = $secretKey
aws_session_token = $sessionToken
"@ | Set-Content (Join-Path $awsDir "credentials")
Write-Host "~/.aws/credentials atualizado."

# Região default — sem isso, todo comando aws sem --region falha com NoRegion
aws configure set region us-east-1
Write-Host "Região default configurada (us-east-1)."

# 2) GitHub Secrets (repo atual)
gh secret set AWS_ACCESS_KEY_ID --body $accessKey
gh secret set AWS_SECRET_ACCESS_KEY --body $secretKey
gh secret set AWS_SESSION_TOKEN --body $sessionToken
Write-Host "Secrets do GitHub atualizados (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN)."

aws sts get-caller-identity
Write-Host "Credenciais válidas. Pronto."
