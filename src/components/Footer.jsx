export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border py-4 text-sm text-muted-foreground">
      <div className="flex flex-wrap justify-center items-center gap-y-1">
        <span className="whitespace-nowrap px-4">
          &copy; 2026{' '}
          <a
            href="https://galwayit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            GalwayIT
          </a>
        </span>
        <span className="text-border">|</span>
        <span className="whitespace-nowrap pl-4 pr-1">Any problems? Contact us at</span>
        <span className="whitespace-nowrap pl-1 pr-4">
          <a
            href="mailto:hello@galwayit.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            hello@galwayit.org
          </a>
        </span>
      </div>
    </footer>
  );
}
