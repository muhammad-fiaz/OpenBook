import { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Github } from "lucide-react";

export const metadata: Metadata = {
  title: "Open Source License",
  description: "OpenBook is open source software licensed under MIT License",
};

export default function LicensePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground">
          <BookOpen className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Open Source License</h1>
            <p className="text-muted-foreground">MIT License</p>
          </div>
          <a
            href="https://github.com/muhammad-fiaz/openbook"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Github className="h-5 w-5" />
            <span>View on GitHub</span>
          </a>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 mb-8">
          <p className="text-sm">
            OpenBook is proudly open source and available on GitHub. Contributions are welcome!
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <pre className="bg-muted p-6 rounded-lg overflow-x-auto text-sm">
{`MIT License

Copyright (c) 2026 Muhammad Fiaz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
          </pre>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Contributing</h2>
            <p>
              We welcome contributions from the community! Please visit our{" "}
              <a
                href="https://github.com/muhammad-fiaz/openbook"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub repository
              </a>{" "}
              to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>Report bugs and issues</li>
              <li>Submit feature requests</li>
              <li>Contribute code improvements</li>
              <li>Improve documentation</li>
              <li>Share your feedback</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">About the Author</h2>
            <p>
              OpenBook is created and maintained by{" "}
              <a
                href="https://github.com/muhammad-fiaz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Muhammad Fiaz
              </a>
              . Connect with me on GitHub to stay updated with the latest developments.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
