"use client"

import * as React from "react"
import { toast } from "sonner"

import { DataTable } from "@/components/datatable/DataTable"
import { deleteVendor } from "@/lib/actions/vendor"
import { Vendor } from "@/types"

import { getVendorsColumns } from "./column"

type VendorDataTableProps = {
  data: Vendor[]
  canEdit: boolean
  canDelete: boolean
  title: string
  actions?: React.ReactNode
}

export default function VendorDataTable({
  data,
  canEdit,
  canDelete,
  title,
  actions,
}: VendorDataTableProps) {
  const [tableData, setTableData] = React.useState(data)

  const deleteHandler = async (id: string) => {
    const res = await deleteVendor(id)

    if (!res?.success) {
      toast.error("Error", { description: res?.message })
      return
    }

    toast.success("Success", { description: res?.message })

    setTableData((prev) =>
      prev.filter((row) => row.id !== id)
    )
  }

  const columns = getVendorsColumns({
    canEdit,
    canDelete,
    onDelete: deleteHandler,
  })

  return <DataTable data={tableData} columns={columns} title={title} actions={actions} />
}
