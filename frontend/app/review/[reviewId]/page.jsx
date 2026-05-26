import ReviewContent from "./ReviewContent"

export const metadata = {
  title: "Spaced Review | focusaint",
  description: "Reinforce your learning",
}

export default async function ReviewPage({ params }) {
  const resolvedParams = await params;
  return <ReviewContent reviewId={resolvedParams.reviewId} />
}
