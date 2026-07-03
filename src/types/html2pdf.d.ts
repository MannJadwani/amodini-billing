declare module "html2pdf.js" {
  // Minimal typing — html2pdf.js ships no types. We only use the chained
  // .set().from().save() API from src/lib/pdf.ts.
  const html2pdf: () => {
    set: (opt: unknown) => {
      from: (el: HTMLElement) => { save: () => Promise<void> };
    };
  };
  export default html2pdf;
}
