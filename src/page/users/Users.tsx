import { Link } from "react-router-dom";

const Users = () => {
  return (
    <div>
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-sm font-semibold text-foreground">Users</h1>
        <Link
          to="/users/add"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          Add Admin
        </Link>
      </div>
    </div>
  );
};

export default Users;
