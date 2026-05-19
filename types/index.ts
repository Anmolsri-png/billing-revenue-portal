import z from "zod"
import {
  roleSchema, userSchema, purchaseOrderSchema, serviceTypeSchema, contractTypeSchema, billingPlanSchema, customerSchema,
  billingCycleSchema,
  contractDurationSchema,
  projectSchema,
  companySchema,
  moduleSchema,
  configurationSchema,
  vendorSchema,
} from "@/lib/validators"

export type Role = z.infer<typeof roleSchema>
export type Module = z.infer<typeof moduleSchema>
export type User = z.infer<typeof userSchema>
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>
export type ContractType = z.infer<typeof contractTypeSchema>
export type ServiceType = z.infer<typeof serviceTypeSchema>
export type BillingPlan = z.infer<typeof billingPlanSchema>
export type Customer = z.infer<typeof customerSchema>
export type BillingCycle = z.infer<typeof billingCycleSchema>
export type ContractDuration = z.infer<typeof contractDurationSchema>
export type Project = z.infer<typeof projectSchema>
export type Company = z.infer<typeof companySchema>
export type Configuration = z.infer<typeof configurationSchema>
export type Vendor = z.infer<typeof vendorSchema>





