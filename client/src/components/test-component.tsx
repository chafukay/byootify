// Simple test component to verify React rendering
export function TestComponent() {
  return (
    <div style={{
      position: "fixed",
      top: "50px",
      left: "50px",
      width: "300px",
      height: "100px",
      background: "red",
      color: "white",
      fontSize: "20px",
      padding: "20px",
      zIndex: 9999,
      border: "5px solid blue"
    }}>
      TEST COMPONENT VISIBLE
    </div>
  );
}