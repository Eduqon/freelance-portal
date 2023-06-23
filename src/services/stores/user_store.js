import create from "zustand";

export const UserStore = create((set) => ({
  id: "",
  name: "",
  contact_no: "",
  role: "",

  setId: (id) => set({ id: id }),
  setName: (name) => set({ name: name }),
  setContactNo: (contact_no) => set({ contact_no: contact_no }),
  setRole: (role) => set({ role: role }),
}));
