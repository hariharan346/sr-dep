import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import api from "@/lib/axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash } from "lucide-react";

// --- API Functions ---
const fetchCategories = async () => {
  const { data } = await api.get("/categories");
  return data;
};

const createCategory = async (newCategory) => {
  const { data } = await api.post("/categories", newCategory, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const updateCategory = async ({ id, updatedCategory }) => {
  const { data } = await api.put(`/categories/${id}`, updatedCategory, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const deleteCategory = async (id) => {
  await api.delete(`/categories/${id}`);
};

const createService = async (newService) => {
  const { data } = await api.post(`/services`, newService, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const updateService = async ({ id, updatedService }) => {
  const { data } = await api.put(`/services/${id}`, updatedService, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

const deleteService = async (id) => {
  await api.delete(`/services/${id}`);
};

// --- Main Component ---
const AdminCategoriesPage = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
  
    const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
    const [isServiceFormOpen, setIsServiceFormOpen] = useState(false);
  
    const [categoryFormData, setCategoryFormData] = useState({ name: "", description: "" });
    const [serviceFormData, setServiceFormData] = useState({ name: "", description: "" });
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
  
    const [editingCategory, setEditingCategory] = useState(null);
    const [editingService, setEditingService] = useState(null);
  
    const [currentCategoryId, setCurrentCategoryId] = useState(null);
  
    // Fetch Categories
    const {
      data: categories,
      isLoading: isLoadingCategories,
      isError: isErrorCategories,
    } = useQuery({
      queryKey: ["categories"],
      queryFn: fetchCategories,
    });
  
    // --- Mutations ---
  
    // Category Mutations
    const categoryCreateMutation = useMutation({
      mutationFn: createCategory,
      onSuccess: () => {
        queryClient.invalidateQueries(["categories"]);
        toast({ title: "Category created" });
        setIsCategoryFormOpen(false);
      },
      onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
    });
  
    const categoryUpdateMutation = useMutation({
      mutationFn: updateCategory,
      onSuccess: () => {
        queryClient.invalidateQueries(["categories"]);
        toast({ title: "Category updated" });
        setIsCategoryFormOpen(false);
      },
      onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
    });
  
    const categoryDeleteMutation = useMutation({
      mutationFn: deleteCategory,
      onSuccess: () => {
        queryClient.invalidateQueries(["categories"]);
        toast({ title: "Category deleted" });
      },
      onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
    });
  
    // Service Mutations
    const serviceCreateMutation = useMutation({
      mutationFn: createService,
      onSuccess: () => {
        queryClient.invalidateQueries(["categories"]);
        toast({ title: "Service created" });
        setIsServiceFormOpen(false);
      },
      onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
    });

    const serviceUpdateMutation = useMutation({
        mutationFn: updateService,
        onSuccess: () => {
          queryClient.invalidateQueries(["categories"]);
          toast({ title: "Service updated" });
          setIsServiceFormOpen(false);
        },
        onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
      });
    
      const serviceDeleteMutation = useMutation({
        mutationFn: deleteService,
        onSuccess: () => {
          queryClient.invalidateQueries(["categories"]);
          toast({ title: "Service deleted" });
        },
        onError: (error) => toast({ title: "Error", description: error.response?.data?.message, variant: "destructive" }),
      });
  
    // --- Handlers ---
  
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleCategoryFormSubmit = () => {
        const formData = new FormData();
        formData.append("name", categoryFormData.name);
        formData.append("description", categoryFormData.description);
        if (imageFile) {
            formData.append("image", imageFile);
        }

      if (editingCategory) {
        categoryUpdateMutation.mutate({ id: editingCategory._id, updatedCategory: formData });
      } else {
        categoryCreateMutation.mutate(formData);
      }
    };
  
    const handleServiceFormSubmit = () => {
        const formData = new FormData();
        formData.append("name", serviceFormData.name);
        formData.append("description", serviceFormData.description);
        if (currentCategoryId) {
            formData.append("category", currentCategoryId);
        }
        if (imageFile) {
            formData.append("image", imageFile);
        }

      if (editingService) {
        serviceUpdateMutation.mutate({ id: editingService._id, updatedService: formData });
      } else {
        serviceCreateMutation.mutate(formData);
      }
    };

    const openCategoryDialog = (category = null) => {
        setEditingCategory(category);
        setCategoryFormData(category ? { name: category.name, description: category.description } : { name: "", description: "" });
        setImageFile(null);
        setImagePreview(category?.image ? `http://localhost:5000${category.image}`: "");
        setIsCategoryFormOpen(true);
      };
      
      const openServiceDialog = (categoryId, service = null) => {
        setCurrentCategoryId(categoryId);
        setEditingService(service);
        setServiceFormData(service ? { name: service.name, description: service.description } : { name: "", description: "" });
        setImageFile(null);
        setImagePreview(service?.image && service.image.startsWith('/') ? `http://localhost:5000${service.image}`: "");
        setIsServiceFormOpen(true);
      };

    if (isLoadingCategories) return <p>Loading...</p>;
    if (isErrorCategories) return <p>Error loading categories.</p>;

    return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
              <h1 className="text-3xl font-bold text-foreground">Manage Categories</h1>
              <Button onClick={() => openCategoryDialog()} className="w-full md:w-auto">Add Category</Button>
            </div>
    
                        {categories && categories.length > 0 ? (
                          <Accordion type="single" collapsible className="w-full">
                            {categories.map((category) => (
                              <Card className="mb-4" key={category._id}>
                                <CardHeader className="p-0">
                                  <AccordionItem value={category._id} className="border-b-0">
                                    <AccordionTrigger className="p-4 hover:no-underline">
                                      <div className="flex flex-col sm:flex-row justify-between w-full items-start sm:items-center">
                                        <div className="flex items-center gap-4 text-left">
                                          <img src={category.image && category.image.startsWith('/') ? `http://localhost:5000${category.image}` : "/placeholder.png"} alt={category.name} className="w-16 h-16 rounded-md object-cover" />
                                          <div>
                                            <span className="font-semibold text-lg line-clamp-1">{category.name}</span>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>

                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <div role="button" className={buttonVariants({ variant: "outline", size: "sm" })} onClick={(e) => {e.stopPropagation(); openCategoryDialog(category);}}>Edit</div>
                                          <div role="button" className={buttonVariants({ variant: "destructive", size: "sm" })} onClick={(e) => {e.stopPropagation(); categoryDeleteMutation.mutate(category._id);}}>Delete</div>
                                        </div>
                                      </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-4 pt-0">
                                      <div className="pl-4 border-l-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <h5 className="font-semibold text-lg">Services</h5>
                                            <Button size="sm" onClick={() => openServiceDialog(category._id)}>Add Service</Button>
                                        </div>
                                        {category.services?.length > 0 ? (
                                          <div className="space-y-2">
                                            {category.services.map((service) => (
                                                <Card key={service._id} className="p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                                    <div className="flex items-center gap-3">
                                                      <img src={service.image ? `http://localhost:5000${service.image}` : "/placeholder.png"} alt={service.name} className="w-10 h-10 rounded-md object-cover" />
                                                      <div>
                                                        <span className="font-medium line-clamp-1">{service.name}</span>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                                                      </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => openServiceDialog(category._id, service)}>Edit</Button>
                                                        <Button variant="destructive" size="sm" onClick={() => serviceDeleteMutation.mutate(service._id)}>Delete</Button>
                                                    </div>
                                                </Card>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-muted-foreground text-sm">No services added yet.</p>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </CardHeader>
                              </Card>
                            ))}
                          </Accordion>
                        ) : (
                          <div className="text-center py-16">
                            <p className="text-muted-foreground text-lg">No categories found. Add one to get started!</p>
                            <Button onClick={() => openCategoryDialog()} className="mt-4">Add Category</Button>
                          </div>
                        )}    
            {/* Category Dialog */}
            <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingCategory ? "Edit" : "Add"} Category</DialogTitle></DialogHeader>
                <div className="mb-4">
                  <Label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">Name</Label>
                  <Input id="categoryName" placeholder="Name" value={categoryFormData.name} onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})} />
                </div>
                <div className="mb-4">
                  <Label htmlFor="categoryDescription" className="block text-sm font-medium text-gray-700">Description</Label>
                  <Textarea id="categoryDescription" placeholder="Description" value={categoryFormData.description} onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})} />
                </div>

                <div className="mb-4">
                  <Label htmlFor="categoryImage" className="block text-sm font-medium text-gray-700">Image</Label>
                  <Input id="categoryImage" type="file" onChange={handleFileChange} />
                  {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 max-w-full h-auto object-cover rounded-md" />}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button onClick={handleCategoryFormSubmit}>Save</Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>



            {/* Service Dialog */}
            <Dialog open={isServiceFormOpen} onOpenChange={setIsServiceFormOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingService ? "Edit" : "Add"} Service</DialogTitle></DialogHeader>
                    <div className="mb-4">
                      <Label htmlFor="serviceName" className="block text-sm font-medium text-gray-700">Name</Label>
                      <Input id="serviceName" placeholder="Name" value={serviceFormData.name} onChange={(e) => setServiceFormData({...serviceFormData, name: e.target.value})} />
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700">Description</Label>
                      <Textarea id="serviceDescription" placeholder="Description" value={serviceFormData.description} onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})} />
                    </div>
                    <div className="mb-4">
                      <Label htmlFor="serviceImage" className="block text-sm font-medium text-gray-700">Image</Label>
                      <Input id="serviceImage" type="file" onChange={handleFileChange} />
                      {imagePreview && <img src={imagePreview} alt="preview" className="mt-2 max-w-full h-auto object-cover rounded-md" />}
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button onClick={handleServiceFormSubmit}>Save</Button>
                      </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          </main>
        </div>
      );
}

export default AdminCategoriesPage;