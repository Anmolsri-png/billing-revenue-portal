"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { PaymentReceived } from "@prisma/client";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { cn } from "@/lib/utils";
import { purchaseOrderSchema } from "@/lib/validators";
import { formatBillingCycleLabel } from "@/lib/billing-cycle-utils";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  themedFieldClassName,
  themedInputClassName,
  themedLabelClassName,
  themedSelectTriggerClassName,
  themedTextareaClassName,
} from "../ui/form-theme";

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
type BillingCycleField = PurchaseOrderFormValues["billingCycles"][number];

const dateButtonClassName = (hasValue?: boolean) =>
  cn(
    themedSelectTriggerClassName,
    "justify-start text-left font-normal",
    !hasValue && "text-muted-foreground",
  );

interface BillingCycleFormProps {
  field: BillingCycleField;
  index: number;
  form: UseFormReturn<PurchaseOrderFormValues>;
}

const BillingCycleForm = ({
  field,
  index,
  form,
}: BillingCycleFormProps) => {
  const invoiceDate =
    form.watch(`billingCycles.${index}.invoiceDate`) ?? field?.invoiceDate;
  const billingSubmittedDate =
    form.watch(`billingCycles.${index}.billingSubmittedDate`) ??
    field?.billingSubmittedDate;
  const invoiceAmount = Number(
    form.watch(`billingCycles.${index}.invoiceAmount`) || 0,
  );
  const collectedAmount = Number(
    form.watch(`billingCycles.${index}.collectedAmount`) || 0,
  );
  const tdsAmount = Number(form.watch(`billingCycles.${index}.tds`) || 0);
  const pendingAmount = invoiceAmount - collectedAmount;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            {formatBillingCycleLabel(invoiceDate ?? billingSubmittedDate)}
          </h2>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-medium">
          <span>Invoice: Rs.{invoiceAmount.toLocaleString()}</span>
          <span>Collected: Rs.{collectedAmount.toLocaleString()}</span>
          <span>Pending: Rs.{pendingAmount.toLocaleString()}</span>
          <span>TDS: Rs.{tdsAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name={`billingCycles.${index}.invoiceNumber`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Invoice Number
              </FormLabel>
              <FormControl>
                <Input
                  className={themedInputClassName}
                  placeholder="Enter Invoice Number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.invoiceAmount`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Invoice Amount
              </FormLabel>
              <FormControl>
                <Input
                  className={cn(
                    themedInputClassName,
                    "cursor-not-allowed bg-slate-50/90 text-slate-600",
                  )}
                  type="number"
                  placeholder="Enter Invoice Amount"
                  readOnly
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.collectedAmount`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Collected Amount
              </FormLabel>
              <FormControl>
                <Input
                  className={themedInputClassName}
                  type="number"
                  placeholder="Enter Collected Amount"
                  {...field}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.tds`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>TDS</FormLabel>
              <FormControl>
                <Input
                  className={themedInputClassName}
                  type="number"
                  placeholder="Enter TDS"
                  {...field}
                  onChange={(event) =>
                    field.onChange(Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.invoiceDate`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>Invoice Date</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={dateButtonClassName(!!field.value)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    avoidCollisions={false}
                    className="w-auto p-0"
                    side="bottom"
                    sideOffset={8}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={(date) => {
                        field.onChange(date);
                        form.setValue(
                          `billingCycles.${index}.paymentDueDate`,
                          date ?? null,
                          {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          },
                        );
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.billingSubmittedDate`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Billing Submitted Date
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={dateButtonClassName(!!field.value)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    avoidCollisions={false}
                    className="w-auto p-0"
                    side="bottom"
                    sideOffset={8}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.paymentReceived`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Payment Received
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className={themedSelectTriggerClassName}>
                    <SelectValue placeholder="Payment Received" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {Object.values(PaymentReceived).map((status) => (
                        <SelectItem value={status} key={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.paymentReceivedDate`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Payment Received Date
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={dateButtonClassName(!!field.value)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    avoidCollisions={false}
                    className="w-auto p-0"
                    side="bottom"
                    sideOffset={8}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.paymentDueDate`}
          render={({ field }) => (
            <FormItem className={themedFieldClassName}>
              <FormLabel className={themedLabelClassName}>
                Payment Due Date
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={dateButtonClassName(!!field.value)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    avoidCollisions={false}
                    className="w-auto p-0"
                    side="bottom"
                    sideOffset={8}
                  >
                    <Calendar
                      mode="single"
                      selected={field.value as Date}
                      onSelect={field.onChange}
                    />
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`billingCycles.${index}.billingRemark`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className={themedLabelClassName}>Remark</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes"
                  className={themedTextareaClassName}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default BillingCycleForm;
