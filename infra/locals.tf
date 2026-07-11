locals {
  tags = {
    Project   = "tech-challenge-fiap"
    Phase     = "fase-2"
    ManagedBy = "terraform"
  }
  cluster_name = "${var.project_name}-eks"
}
