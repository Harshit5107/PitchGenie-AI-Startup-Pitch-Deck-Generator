const BackgroundDesign = ({ themeId }: { themeId: string }) => {
  if (themeId === 'modern-gradient') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[0%] left-[0%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-[0%] right-[0%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[100px] mix-blend-screen" />
      </div>
    );
  }
  if (themeId === 'clean-minimal') {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1.5px, transparent 0)', backgroundSize: '32px 32px' }} />
    );
  }
  if (themeId === 'corporate-pro') {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-[-10%] w-[40%] h-[200%] bg-blue-500/5 transform rotate-[-15deg] origin-top opacity-50" />
        <div className="absolute bottom-0 left-[-10%] w-[30%] h-[200%] bg-blue-500/5 transform rotate-[15deg] origin-bottom opacity-30" />
        <div className="absolute bottom-0 right-[25%] w-[1px] h-[50%] bg-blue-500/20" />
      </div>
    );
  }
  if (themeId === 'bold-neon') {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/20 blur-[100px] mix-blend-screen" />
      </div>
    );
  }
  if (themeId === 'elegant-dark') {
    return (
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] border-[1px] border-yellow-500/10 rounded-full" />
        <div className="absolute top-[-25%] left-[-25%] w-[150%] h-[150%] border-[2px] border-yellow-500/5 rounded-full" />
      </div>
    );
  }
  if (themeId === 'startup-fire') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-orange-500/10 blur-[100px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/10 blur-[100px] rounded-full mix-blend-screen" />
      </div>
    );
  }
  return null;
};

export default BackgroundDesign;
