const Blogs = require('../models/blog.model')
const User = require('../models/users.model')
const {calculateReadingTime} = require('../utils/BlogReadingTime')

const createBlog = async(req, res) =>{

    try{

        const {title, description, body, tags, state='draft', read_count=0,  author= req.user._id } = req.body

        const blog={
            title,
            description,
            body,
            tags,
            state,
            read_count,
            author,
            reading_time: calculateReadingTime(body)
            
            
        }

       const blogResult= await Blogs.create(blog)

        res.status(201).json({message:'Blog created successfully!', data:blogResult})
    }catch(error){
         return res.status(500).json({
            message: 'Internal server error',
            error: error.message
    })
}
}

const updateBlogState = async(req, res) =>{
   try{
        const blog = await Blogs.findById(req.params.id);

        if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
        }

         if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this blog' });
    }

        blog.state = 'published';
        await blog.save();

         res.status(200).json({message:'Blog updated successfully!', data:blog})
    }catch(error){
          return res.status(500).json({
            message: 'Internal server error',
            error: error.message
    })
    }
 
}



const AllBlogsExternal = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt', // 'timestamp'
      order = 'desc',
      search = ''
    } = req.query;

    const validSortFields = ['read_count', 'reading_time', 'createdAt'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        message: `Invalid sortBy value. Use one of: ${validSortFields.join(', ')}`,
      });
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const searchRegex = new RegExp(search, 'i');

    // First, find matching authors if search is used
    const matchingAuthors = search
      ? await User.find({
          $or: [
            { first_name: { $regex: searchRegex } },
            { last_name: { $regex: searchRegex } },
          ]
        }).select('_id')
      : [];

    const authorIds = matchingAuthors.map(author => author._id);

    // Build search query
    const searchQuery = {
      state: 'published',
      $or: [
        { title: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
        ...(authorIds.length > 0 ? [{ author: { $in: authorIds } }] : [])
      ]
    };

    // Fetch blogs
    const blogs = await Blogs.find(searchQuery)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(pageSize)
      .populate('author', 'first_name last_name email');

    const total = await Blogs.countDocuments(searchQuery);

    res.status(200).json({
      message: 'Published blogs retrieved successfully',
      totalBlogs: total,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
      sortBy,
      order,
      search,
      data: blogs,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};



const singleBlogs = async (req, res) =>{
    try{
      const blog=  await Blogs.findOneAndUpdate({_id:req.params.id, state:'published'},
            {$inc:{read_count: 1}},
             { new: true }

        ).populate('author', 'first_name last_name email');

         if (!blog) {
      return res.status(404).json({ message: 'Published blog not found' });
    }

    res.status(200).json({ message: 'Blog fetched successfully', data: blog });

    } catch(error){
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
    })
    }
}

// The owner of a blog should be able to edit the blog in draft or published state
const editBlog = async (req, res) =>{
    try{
        const findBlog = await Blogs.findById(req.params.id)

        if (!findBlog){
            return res.status(404).json({message:'Blog not found'})

        }

        if (findBlog.author.toString() !== req.user._id.toString()){
            return res.status(403).json({message:'you do not have permission to edit this blog'})

        }

        const allowedFields =['title', 'tags', 'description', 'body']

        allowedFields.forEach((field) =>{
            if (req.body[field]){
                findBlog[field] = req.body[field]
            } 

        })

           if (req.body.body) {
                findBlog.reading_time = calculateReadingTime(req.body.body);
            }

             const updatedBlog = await findBlog.save();

            res.status(200).json({
            message: 'Blog updated successfully',
            data: updatedBlog,
            });

    } catch(error){
        res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
    }
}

// The owner of the blog should be able to delete the blog in draft or published state
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blogs.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not allowed to delete this blog' });
    }

    await Blogs.findByIdAndDelete(req.params.id);  // Now delete it

    res.status(200).json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

const getUserBlogs = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      state,
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'timestamp',
      order = 'desc',
    } = req.query;

    // Validate sortBy field
    const validSortFields = ['read_count', 'reading_time', 'timestamp'];
    if (!validSortFields.includes(sortBy)) {
      return res.status(400).json({
        message: `Invalid sortBy field. Use one of: ${validSortFields.join(', ')}`,
      });
    }

    // Map 'timestamp' to 'createdAt' for sorting
    const sortField = sortBy === 'timestamp' ? 'createdAt' : sortBy;
    const sortOrder = order === 'asc' ? 1 : -1;

    // Build base query
    const query = { author: userId };
    if (state) query.state = state;

    // Add search conditions if search is provided
    if (search.trim() !== '') {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: { $regex: searchRegex } },
        { tags: { $in: [searchRegex] } },
      ];
      // Note: Author is always userId here, so no need to search author names.
    }

    // Pagination calculations
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Sorting options
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;

    // Query blogs
    const blogs = await Blogs.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    const total = await Blogs.countDocuments(query);

    res.status(200).json({
      message: 'Your blogs retrieved successfully',
      totalBlogs: total,
      currentPage: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      pageSize,
      sortBy,
      order,
      search,
      data: blogs,
    });

  } catch (error) {
    res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};



module.exports={createBlog, updateBlogState, AllBlogsExternal, singleBlogs, editBlog, deleteBlog, getUserBlogs}