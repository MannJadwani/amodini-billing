// Browser-side HTML → PDF using html2pdf.js (loaded dynamically so it never
// runs on the server and never blocks the rest of the app if it fails).

export async function downloadElementAsPdf(el: HTMLElement, fileName: string): Promise<void> {
  // Dynamic import keeps this out of the server bundle.
  const { default: html2pdf } = await import("html2pdf.js");
  await html2pdf()
    .set({
      margin: 0,
      filename: fileName,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
      jsPDF: { unit: "pt", format: "a4", orientation: "portrait" },
    })
    .from(el)
    .save();
}
