import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { MapPin, Plus, Trash2, Star, User, Phone, Mail } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Address = Tables<'addresses'>;
type Profile = Tables<'profiles'>;

const ProfilePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editProfile, setEditProfile] = useState({ full_name: '', phone: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    const [{ data: prof }, { data: addrs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('addresses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (prof) { setProfile(prof); setEditProfile({ full_name: prof.full_name, phone: prof.phone || '' }); }
    else { setEditProfile({ full_name: user.user_metadata?.full_name || '', phone: '' }); }
    if (addrs) setAddresses(addrs);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = profile
      ? await supabase.from('profiles').update({ full_name: editProfile.full_name, phone: editProfile.phone }).eq('user_id', user.id)
      : await supabase.from('profiles').insert({ user_id: user.id, full_name: editProfile.full_name, phone: editProfile.phone });
    setSaving(false);
    if (error) toast.error('Failed to save');
    else { toast.success('Profile updated!'); fetchData(); }
  };

  const addAddress = async () => {
    if (!user || !newAddr.address_line || !newAddr.city || !newAddr.pincode) {
      toast.error('Please fill address, city, and pincode');
      return;
    }
    const { error } = await supabase.from('addresses').insert({
      user_id: user.id, ...newAddr, is_default: addresses.length === 0,
    });
    if (error) toast.error('Failed to save');
    else {
      toast.success('Address saved!');
      setNewAddr({ address_line: '', city: '', state: '', pincode: '', label: 'Home' });
      setShowAddForm(false);
      fetchData();
    }
  };

  const setDefault = async (id: string) => {
    if (!user) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    toast.success('Default address updated');
    fetchData();
  };

  const deleteAddress = async (id: string) => {
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        toast.error('This address is linked to existing orders and cannot be deleted');
      } else {
        toast.error('Failed to delete address');
      }
      return;
    }
    toast.success('Address removed');
    fetchData();
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl font-bold mb-8">My Profile</h1>

          {/* Profile Info */}
          <div className="bg-card rounded-xl p-6 border border-border/50 mb-6">
            <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-primary" /> Personal Info</h2>
            <div className="space-y-3">
              <div>
                <Label>Full Name</Label>
                <Input value={editProfile.full_name} onChange={e => setEditProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editProfile.phone} onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))} placeholder="9454950104" />
              </div>
              <div>
                <Label>Email</Label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                  <Mail className="w-4 h-4" /> {user?.email}
                </div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="btn-premium rounded-lg">
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-card rounded-xl p-6 border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Saved Addresses</h2>
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)} className="gap-1">
                <Plus className="w-4 h-4" /> Add New
              </Button>
            </div>

            {showAddForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-4 rounded-lg border border-border bg-muted/20">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>Label</Label>
                    <Input value={newAddr.label} onChange={e => setNewAddr(p => ({ ...p, label: e.target.value }))} placeholder="Home / Office" />
                  </div>
                  <div>
                    <Label>Pincode</Label>
                    <Input value={newAddr.pincode} onChange={e => setNewAddr(p => ({ ...p, pincode: e.target.value }))} placeholder="123456" />
                  </div>
                </div>
                <div className="mb-3">
                  <Label>Address</Label>
                  <Input value={newAddr.address_line} onChange={e => setNewAddr(p => ({ ...p, address_line: e.target.value }))} placeholder="House/Flat, Street, Area" />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <Label>City</Label>
                    <Input value={newAddr.city} onChange={e => setNewAddr(p => ({ ...p, city: e.target.value }))} placeholder="City" />
                  </div>
                  <div>
                    <Label>State</Label>
                    <Input value={newAddr.state} onChange={e => setNewAddr(p => ({ ...p, state: e.target.value }))} placeholder="State" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addAddress}>Save Address</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}

            {addresses.length === 0 && !showAddForm ? (
              <p className="text-muted-foreground text-sm text-center py-8">No saved addresses. Add one to speed up checkout!</p>
            ) : (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id} className={`p-4 rounded-lg border transition-all ${addr.is_default ? 'border-primary bg-primary/5' : 'border-border'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase text-primary">{addr.label}</span>
                          {addr.is_default && (
                            <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <Star className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-foreground text-sm">{addr.address_line}, {addr.city}{addr.state ? `, ${addr.state}` : ''} - {addr.pincode}</p>
                      </div>
                      <div className="flex gap-1">
                        {!addr.is_default && (
                          <Button variant="ghost" size="sm" onClick={() => setDefault(addr.id)} className="text-xs text-muted-foreground hover:text-primary">
                            Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => deleteAddress(addr.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
