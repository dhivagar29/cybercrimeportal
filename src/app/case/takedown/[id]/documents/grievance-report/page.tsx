import { TakedownGrievanceDocument } from "@/components/takedown-grievance-document";

type Props = { params: Promise<{ id: string }> };

export default async function GrievanceReportPage({ params }: Props) {
  const { id } = await params;
  return <TakedownGrievanceDocument acknowledgement={id} />;
}
