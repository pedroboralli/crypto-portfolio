export const ChainIcon = ({ chainId, className = "w-5 h-5" }) => {
  switch (chainId) {
    case 'ethereum':
    case 'eth':
      return (
        <svg className={className} viewBox="0 0 256 417" fill="currentColor">
          <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" fillOpacity=".6" />
          <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
          <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" fillOpacity=".6" />
          <path d="M127.962 416.905v-104.72L0 236.585z" />
        </svg>
      );
    case 'arbitrum':
    case 'arb':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.47l7 3.5v7.85l-7-3.5V9.47zm9 11.35v-7.85l7-3.5v7.85l-7 3.5z" />
        </svg>
      );
    case 'polygon':
    case 'matic':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'bitcoin':
    case 'btc':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z" />
        </svg>
      );
    case 'bnb':
    case 'bsc':
      return (
        <svg className={className} viewBox="0 0 2500 2500" fill="currentColor">
          <path d="M764.48 1050.52L1250 565l485.75 485.73 282.5-282.5L1250 0 482.02 767.98l282.46 282.54z" />
          <path d="M0 1250l282.5-282.5L565 1250 282.5 1532.5z" />
          <path d="M764.48 1449.48L1250 1935l485.74-485.73 282.65 282.35-.14.15L1250 2500l-768.13-768.13-.14-.15 282.75-282.24z" />
          <path d="M1935 1250l282.5-282.5L2500 1250l-282.5 282.5z" />
          <path d="M1536.52 1250L1250 963.48 1038.99 1174.5l-24.49 24.49-39.01 39.01L1250 1512.5l286.52-286.52-.03-.03.03.05z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      );
  }
};

export default ChainIcon;
