import { Pixrow } from "@/components/Pixrow";

export function StatementBand() {
  return (
    <section className="lp-band reveal">
      <div className="wrap">
        <Pixrow />
        <div className="statement">
          <code>node_modules</code> is the heaviest object in the known universe.{" "}
          <em>We help you delete it.</em>
        </div>
        <Pixrow mirror />
      </div>
    </section>
  );
}
