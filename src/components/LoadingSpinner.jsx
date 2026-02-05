export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner__circle"></div>
      <p className="loading-spinner__message">{message}</p>
    </div>
  );
}
