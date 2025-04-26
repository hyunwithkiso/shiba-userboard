import { redirect } from "next/navigation";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { "txn-id"?: string };
}) {
  const txnId = searchParams["txn-id"];

  if (!txnId) {
    return redirect("/checkout/complete");
  }

  // txn-id 파라미터를 포함하여 /checkout/complete로 리다이렉트
  return redirect(`/checkout/complete?txn-id=${encodeURIComponent(txnId)}`);
}
