import { useEffect, useState, useCallback } from 'react';
import {
  ChevronRight,
  Building2,
  Users,
  Folder,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FolderTree,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ConfirmContext.jsx';
import { getVisibleRoots } from '../../utils/orgTree.js';

const UNIT_ICON = {
  department: Building2,
  team: Users,
};

const UNIT_ICON_STYLE = {
  department: 'bg-brand-50 text-brand-600',
  team: 'bg-violet-50 text-violet-600',
};

function IconButton({ onClick, disabled, title, tone = 'default', children }) {
  const toneCls =
    tone === 'danger'
      ? 'hover:bg-red-50 hover:text-red-600'
      : tone === 'success'
        ? 'hover:bg-emerald-50 hover:text-emerald-600'
        : 'hover:bg-gray-100 hover:text-gray-800';
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`w-6 h-6 flex items-center justify-center rounded-md text-gray-400 transition-colors disabled:opacity-40 ${toneCls}`}
    >
      {children}
    </button>
  );
}

function InlineForm({ placeholder, onSubmit, onCancel, busy, autoFocus = true }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-1.5 py-1 animate-fade-in">
      <input
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) onSubmit(value.trim());
          if (e.key === 'Escape') onCancel();
        }}
        className="input-sm w-56"
      />
      <IconButton title="Lưu" tone="success" disabled={busy || !value.trim()} onClick={() => onSubmit(value.trim())}>
        <Check size={14} />
      </IconButton>
      <IconButton title="Hủy" onClick={onCancel}>
        <X size={14} />
      </IconButton>
    </div>
  );
}

function TreeRow({ icon, iconClass, label, meta, actions }) {
  return (
    <div className="group flex items-center gap-2 py-1.5 pr-1 rounded-lg hover:bg-gray-50 transition-colors">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${iconClass}`}>{icon}</div>
      <span className="text-sm font-medium text-gray-800 truncate">{label}</span>
      {meta && <span className="text-xs text-gray-400 shrink-0">{meta}</span>}
      <div className="flex-1" />
      <div className="flex items-center gap-0.5 shrink-0">{actions}</div>
    </div>
  );
}

function OrgNode({ node, onChange, canManageUnits }) {
  const confirm = useConfirm();
  const [expanded, setExpanded] = useState(true);
  const [adding, setAdding] = useState(null); // 'department' | 'team' | 'project' | null
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);

  const childUnits = node.children || [];
  const childProjects = node.projects || [];
  const hasChildren = childUnits.length + childProjects.length > 0;
  const Icon = UNIT_ICON[node.type];

  async function handleAdd(type, name) {
    setBusy(true);
    try {
      if (type === 'project') {
        await api.post('/org/projects', { name, orgUnit: node._id });
      } else {
        await api.post('/org/units', { name, type, parent: node._id });
      }
      setAdding(null);
      setExpanded(true);
      onChange();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(name) {
    setBusy(true);
    try {
      await api.patch(`/org/units/${node._id}`, { name });
      setRenaming(false);
      onChange();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const childCount = childUnits.length + childProjects.length;
    const warning =
      childCount > 0
        ? `Đơn vị "${node.name}" chứa ${childCount} mục con. Xóa sẽ xóa ĐỆ QUY toàn bộ đơn vị con, dự án, tài liệu và báo cáo liên quan. Tiếp tục?`
        : `Xóa đơn vị "${node.name}"?`;
    const ok = await confirm({ title: 'Xóa đơn vị', message: warning, danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      await api.delete(`/org/units/${node._id}`);
      onChange();
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
      setBusy(false);
    }
  }

  return (
    <div>
      {renaming ? (
        <div className="flex items-center gap-2 py-1">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${UNIT_ICON_STYLE[node.type]}`}>
            <Icon size={13} />
          </div>
          <InlineForm placeholder="Tên mới" busy={busy} onSubmit={handleRename} onCancel={() => setRenaming(false)} />
        </div>
      ) : (
        <TreeRow
          icon={<Icon size={13} />}
          iconClass={UNIT_ICON_STYLE[node.type]}
          label={node.name}
          meta={node.type === 'department' ? 'Phòng ban' : 'Nhóm'}
          actions={
            <>
              {canManageUnits && (
                <>
                  <IconButton title="Thêm phòng ban con" onClick={() => setAdding('department')}>
                    <Building2 size={13} />
                  </IconButton>
                  <IconButton title="Thêm nhóm" onClick={() => setAdding('team')}>
                    <Users size={13} />
                  </IconButton>
                </>
              )}
              <IconButton title="Thêm dự án" onClick={() => setAdding('project')}>
                <Folder size={13} />
              </IconButton>
              {canManageUnits && (
                <>
                  <IconButton title="Sửa tên" onClick={() => setRenaming(true)}>
                    <Pencil size={13} />
                  </IconButton>
                  <IconButton title="Xóa" tone="danger" onClick={handleDelete}>
                    <Trash2 size={13} />
                  </IconButton>
                </>
              )}
              {hasChildren && (
                <IconButton title={expanded ? 'Thu gọn' : 'Mở rộng'} onClick={() => setExpanded((v) => !v)}>
                  <ChevronRight size={14} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
                </IconButton>
              )}
            </>
          }
        />
      )}

      {adding && (
        <div className="ml-3 pl-4 border-l border-gray-200">
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                adding === 'project' ? 'bg-amber-50 text-amber-600' : UNIT_ICON_STYLE[adding]
              }`}
            >
              {adding === 'project' ? <Folder size={13} /> : adding === 'department' ? <Building2 size={13} /> : <Users size={13} />}
            </div>
            <InlineForm
              placeholder={adding === 'project' ? 'Tên dự án' : adding === 'department' ? 'Tên phòng ban' : 'Tên nhóm'}
              busy={busy}
              onSubmit={(name) => handleAdd(adding, name)}
              onCancel={() => setAdding(null)}
            />
          </div>
        </div>
      )}

      {expanded && hasChildren && (
        <div className="ml-3 pl-4 border-l border-gray-200 space-y-0.5">
          {childUnits.map((child) => (
            <OrgNode key={child._id} node={child} onChange={onChange} canManageUnits={canManageUnits} />
          ))}
          {childProjects.map((project) => (
            <ProjectNode key={project._id} project={project} onChange={onChange} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectNode({ project, onChange }) {
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleRename(name) {
    setBusy(true);
    try {
      await api.patch(`/org/projects/${project._id}`, { name });
      setRenaming(false);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    const ok = await confirm({
      title: 'Xóa dự án',
      message: `Xóa dự án "${project.name}"? Tài liệu gắn với dự án này cũng sẽ bị xóa.`,
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await api.delete(`/org/projects/${project._id}`);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  if (renaming) {
    return (
      <div className="flex items-center gap-2 py-1">
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-amber-50 text-amber-600">
          <Folder size={13} />
        </div>
        <InlineForm placeholder="Tên dự án" busy={busy} onSubmit={handleRename} onCancel={() => setRenaming(false)} />
      </div>
    );
  }

  return (
    <TreeRow
      icon={<Folder size={13} />}
      iconClass="bg-amber-50 text-amber-600"
      label={project.name}
      meta="Dự án"
      actions={
        <>
          <IconButton title="Sửa tên" onClick={() => setRenaming(true)}>
            <Pencil size={13} />
          </IconButton>
          <IconButton title="Xóa" tone="danger" onClick={handleDelete}>
            <Trash2 size={13} />
          </IconButton>
        </>
      }
    />
  );
}

export default function OrgStructurePage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingRoot, setAddingRoot] = useState(false);

  const load = useCallback(async () => {
    const { data } = await api.get('/org/tree');
    setTree(data.tree);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddRootDepartment(name) {
    await api.post('/org/units', { name, type: 'department', parent: null });
    setAddingRoot(false);
    load();
  }

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  // A manager only ever sees their own department/team and everything
  // nested under it — never the rest of the company's structure.
  const visibleRoots = getVisibleRoots(tree, user);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FolderTree size={20} className="text-brand-600" />
            {isAdmin ? 'Cơ cấu tổ chức' : 'Dự án của tôi'}
          </h1>
          <p className="page-subtitle">
            {isAdmin
              ? 'Phòng ban và nhóm có thể lồng nhau tùy ý; dự án luôn là lá của cây.'
              : 'Tạo và quản lý dự án trong phạm vi đơn vị của bạn.'}
          </p>
        </div>
        {isAdmin && (
          !addingRoot ? (
            <button onClick={() => setAddingRoot(true)} className="btn-primary-sm">
              <Plus size={14} /> Thêm phòng ban gốc
            </button>
          ) : (
            <InlineForm placeholder="Tên phòng ban" onSubmit={handleAddRootDepartment} onCancel={() => setAddingRoot(false)} />
          )
        )}
      </div>

      <div className="card">
        {visibleRoots.length === 0 ? (
          <div className="empty-state">
            <FolderTree size={32} className="text-gray-300 mb-1" />
            <p>{isAdmin ? 'Chưa có phòng ban nào.' : 'Bạn chưa được gán vào đơn vị nào.'}</p>
            {isAdmin && <p>Hãy thêm phòng ban gốc đầu tiên để bắt đầu xây dựng cơ cấu tổ chức.</p>}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleRoots.map((node) => (
              <OrgNode key={node._id} node={node} onChange={load} canManageUnits={isAdmin} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
