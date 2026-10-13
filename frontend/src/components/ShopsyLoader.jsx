import { useEffect, useState } from "react";

const shoppingQuotes = [
  {
    text: "Whoever said money can't buy happiness simply didn't know where to shop.",
    author: "Bo Derek",
  },
  {
    text: "I like my money right where I can see it: hanging in my closet.",
    author: "Carrie Bradshaw",
  },
  {
    text: "People will stare. Make it worth their while.",
    author: "Harry Winston",
  },
  {
    text: "The joy of discovery is one of the biggest joys of shopping.",
    author: "Simon Doonan",
  },
];

function ShopsyLoader({ label = "Setting up your Shopsy experience...", fullScreen = false }) {
  const [quoteIndex, setQuoteIndex] = useState(0);

  useEffect(() => {
    const quoteTimer = window.setInterval(() => {
      setQuoteIndex((currentIndex) => (currentIndex + 1) % shoppingQuotes.length);
    }, 4200);

    return () => window.clearInterval(quoteTimer);
  }, []);

  const quote = shoppingQuotes[quoteIndex];

  return (
    <div className={`shopsy-loader${fullScreen ? " shopsy-loader-fullscreen" : ""}`} role="status" aria-live="polite">
      <div className="shopsy-loader-scene" aria-hidden="true">
        <div className="shopsy-loader-product shopsy-loader-product-left">♡</div>
        <div className="shopsy-loader-product shopsy-loader-product-right">✦</div>
        <div className="shopsy-loader-orbit">
          <span />
          <span />
          <span />
          <div className="shopsy-loader-bag">
            <span className="shopsy-loader-bag-handle" />
            <span className="shopsy-loader-bag-body">S</span>
          </div>
        </div>
      </div>
      <strong>{label}</strong>
      <small className="shopsy-loader-subtitle">Finding a few things you'll love</small>
      <div className="shopsy-loader-progress" aria-hidden="true">
        <span />
      </div>
      <div className="shopsy-loader-quote" key={quoteIndex}>
        <span>“{quote.text}”</span>
        <small>— {quote.author}</small>
      </div>
    </div>
  );
}

export default ShopsyLoader;
