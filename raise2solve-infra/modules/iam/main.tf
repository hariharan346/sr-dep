variable "environment" {
  type        = string
  description = "Target deployment environment"
}

variable "oidc_provider_arn" {
  type        = string
  description = "OIDC Provider ARN from EKS"
}

variable "oidc_provider_url" {
  type        = string
  description = "OIDC Provider URL from EKS"
}

variable "s3_bucket_arn" {
  type        = string
  description = "ARN of S3 bucket for uploads"
}

locals {
  oidc_clean_url = replace(var.oidc_provider_url, "https://", "")
}

resource "aws_iam_role" "backend_s3_irsa" {
  name = "raise2solve-backend-s3-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = var.oidc_provider_arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "${local.oidc_clean_url}:sub" = "system:serviceaccount:raise2solve:raise2solve-backend-sa"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "backend_s3" {
  name        = "raise2solve-backend-s3-policy-${var.environment}"
  description = "Allows backend service account to manage files inside the uploads bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          var.s3_bucket_arn,
          "${var.s3_bucket_arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backend_s3" {
  role       = aws_iam_role.backend_s3_irsa.name
  policy_arn = aws_iam_policy.backend_s3.arn
}

output "backend_s3_role_arn" {
  value = aws_iam_role.backend_s3_irsa.arn
}
