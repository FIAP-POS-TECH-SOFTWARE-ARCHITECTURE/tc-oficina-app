variable "aws_region" {
  description = "Região AWS"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefixo dos recursos"
  type        = string
  default     = "oficina"
}

variable "eks_instance_type" {
  description = "Tipo de instância do node group"
  type        = string
  default     = "t3.medium"
}

variable "eks_desired_size" {
  type    = number
  default = 2
}

variable "eks_min_size" {
  type    = number
  default = 2
}

variable "eks_max_size" {
  type    = number
  default = 4
}

variable "db_name" {
  type    = string
  default = "oficina"
}

variable "db_username" {
  description = "Usuário master do RDS"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Senha master do RDS (via TF_VAR_db_password — nunca commitar)"
  type        = string
  sensitive   = true
}
