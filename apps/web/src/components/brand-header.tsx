import avatar from "#/assets/avatar.png";

/** Personal brand band above the site nav. Scrolls away; the nav stays sticky. */
export default function BrandHeader() {
  return (
    <section className="border-border border-b bg-background px-4">
      <div className="page-wrap flex items-center gap-4 py-5 sm:gap-6 sm:py-6">
        <img
          alt="Jacob Ooi as a Lego minifigure, building with bricks"
          className="h-16 w-auto flex-shrink-0 sm:h-24"
          height={238}
          src={avatar}
          width={254}
        />
        <div className="min-w-0">
          <p className="m-0 text-muted-foreground text-xs sm:text-sm">
            <span className="font-semibold text-foreground">Jacob Ooi</span> ·
            Head of Transformation and Analytics @ Ventia Australia (ASX: VNT)
          </p>
          <p className="display-title m-0 mt-1 text-2xl text-foreground leading-tight sm:text-4xl">
            Building is my <span className="text-primary">love language.</span>
          </p>
          <p className="m-0 mt-1 text-muted-foreground text-sm sm:text-base">
            Applying AI to real work and real life.
          </p>
        </div>
      </div>
    </section>
  );
}
