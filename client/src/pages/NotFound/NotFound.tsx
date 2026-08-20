import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-4 text-xl text-muted-foreground">页面不存在</p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        返回首页
      </Link>
    </div>
  );
};

export default NotFound;
