import type { Announcement, Department } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

async function call<T>(name: string, data: Record<string, unknown>): Promise<T> {
  if (!firebaseApp) throw new Error('Firebase content services are not configured.');
  try {
    return await callFirebaseCallable<T>(name, data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Firebase could not complete this content operation.';
    throw new Error(message);
  }
}

function mapDepartment(id: string, data: Record<string, unknown>): Department {
  return {
    id,
    code: typeof data.code === 'string' ? data.code : '',
    name: typeof data.name === 'string' ? data.name : '',
    description: typeof data.description === 'string' ? data.description : '',
    chiefCoordinator: typeof data.chiefCoordinator === 'string'
      ? data.chiefCoordinator
      : typeof data.chief_coordinator === 'string' ? data.chief_coordinator : '',
    contact: typeof data.contact === 'string' ? data.contact : '',
    iconName: typeof data.iconName === 'string'
      ? data.iconName
      : typeof data.icon_name === 'string' ? data.icon_name : 'Cpu',
  };
}

function mapAnnouncement(id: string, data: Record<string, unknown>): Announcement {
  const type = ['urgent', 'general', 'prize', 'workshop'].includes(String(data.type))
    ? data.type as Announcement['type'] : 'general';
  const scope = data.scope === 'department' ? 'department' : 'fest-wide';
  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    message: typeof data.message === 'string' ? data.message : '',
    type,
    scope,
    departmentCode: typeof data.departmentCode === 'string'
      ? data.departmentCode
      : typeof data.department_code === 'string' ? data.department_code : undefined,
    date: typeof data.date === 'string'
      ? data.date
      : typeof data.date_display === 'string' ? data.date_display : '',
  };
}

export const FirebaseContentService = {
  async departments(): Promise<Department[]> {
    const result = await call<{ departments: Array<Record<string, unknown> & { id: string }> }>('listPublicDepartments', {});
    return (Array.isArray(result.departments) ? result.departments : [])
      .map(department => mapDepartment(department.id, department))
      .sort((left, right) => left.name.localeCompare(right.name));
  },

  async createDepartment(department: Omit<Department, 'id'> & { id?: string }): Promise<Department> {
    const result = await call<{ department: Department }>('manageDepartment', { action: 'create', department });
    return mapDepartment(result.department.id, result.department as unknown as Record<string, unknown>);
  },

  async updateDepartment(id: string, department: Partial<Department>): Promise<Department | null> {
    const result = await call<{ department: Department }>('manageDepartment', { action: 'update', id, department });
    return result.department ? mapDepartment(result.department.id, result.department as unknown as Record<string, unknown>) : null;
  },

  async deleteDepartment(id: string): Promise<boolean> {
    const result = await call<{ success: boolean }>('manageDepartment', { action: 'delete', id });
    return result.success === true;
  },

  async announcements(): Promise<Announcement[]> {
    const result = await call<{ announcements: Array<Record<string, unknown> & { id: string }> }>('listPublicAnnouncements', {});
    return (Array.isArray(result.announcements) ? result.announcements : [])
      .map(announcement => mapAnnouncement(announcement.id, announcement))
      .sort((left, right) => right.date.localeCompare(left.date));
  },

  async createAnnouncement(announcement: Omit<Announcement, 'id' | 'date'>): Promise<Announcement> {
    const result = await call<{ announcement: Announcement }>('manageAnnouncement', { action: 'create', announcement });
    return mapAnnouncement(result.announcement.id, result.announcement as unknown as Record<string, unknown>);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await call<{ success: boolean }>('manageAnnouncement', { action: 'delete', id });
  },
};
