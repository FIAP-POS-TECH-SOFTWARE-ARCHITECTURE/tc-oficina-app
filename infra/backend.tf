# Bootstrap (uma única vez, manual — backend não cria o próprio bucket):
#   aws s3api create-bucket --bucket <SEU_BUCKET_TFSTATE> --region us-east-1
#   aws s3api put-bucket-versioning --bucket <SEU_BUCKET_TFSTATE> --versioning-configuration Status=Enabled
terraform {
  backend "s3" {
    bucket       = "tc-fiap-oficina-tfstate-076155200589" # ajustar: nome de bucket é global — sufixar com id da conta
    key          = "fase-2/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}
