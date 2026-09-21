import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, errorMessage } from "../lib/api.js";
import type { Page, Space } from "@wiki-app/shared";

function PageTree({ pages, parentId }: { pages: Page[]; parentId: number | null }) {
  const children = pages.filter((p) => p.parent_page_id === parentId);
  if (children.length === 0) return null;
  return (
    <ul className="page-tree">
      {children.map((p) => (
        <li key={p.id}>
          <Link to={`/pages/${p.id}`}>{p.title}</Link>
          <PageTree pages={pages} parentId={p.id} />
        </li>
      ))}
    </ul>
  );
}

export default function SpaceDetail() {
  const { id } = useParams();
  const spaceId = Number(id);
  const navigate = useNavigate();

  const [space, setSpace] = useState<Space | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    api
      .getSpace(spaceId)
      .then(setSpace)
      .catch((err) => setError(errorMessage(err)));
    api.getSpacePages(spaceId).then((res) => setPages(res.data));
  }, [spaceId]);

  const createPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const created = await api.createPage({ space_id: spaceId, title: newTitle.trim(), body: "" });
      navigate(`/pages/${created.id}?edit=1`);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  if (error) return <p className="banner error">{error}</p>;
  if (!space) return <p>Loading...</p>;

  return (
    <div>
      <h1>
        {space.name}{" "}
        <span className={`badge ${space.is_restricted ? "badge-restricted" : "badge-public"}`}>
          {space.is_restricted ? "Restricted" : "Public"}
        </span>
      </h1>
      <p className="muted">{space.description}</p>

      <h2>New page</h2>
      <form className="form" onSubmit={createPage}>
        <input
          type="text"
          placeholder="Page title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          style={{ minWidth: 280 }}
        />
        <button type="submit" disabled={creating || !newTitle.trim()}>
          Create
        </button>
      </form>

      <h2>Pages</h2>
      {pages.length === 0 ? <p className="muted">No pages yet.</p> : <PageTree pages={pages} parentId={null} />}
    </div>
  );
}
